import {RuntimePackage, RuntimePackage_WithOutput} from '../core/types';
import {
	__stringify,
	BadImplementationException,
	BeLogged,
	DebugFlag,
	filterDuplicates,
	flatArray,
	ImplementationMissingException,
	lastElement,
	LogClient,
	LogClient_Terminal,
	Logger,
	LogLevel,
	sleep
} from '@nu-art/ts-common';
import {RuntimeParams} from '../core/params/params';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {mapProjectPackages} from './map-project-packages';
import {MemKey_Packages} from '../core/consts';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Default_Files, Default_OutputFiles, MemKey_DefaultFiles, MemKey_RunningStatus, RunningStatus} from '../defaults/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_AbortSignal, MemKey_ProjectManager} from '../project-manager';
import {MemKey_ProjectScreen, ProjectScreen} from '../screen/ProjectScreen';


export const PackageBuildPhaseType_Package = 'package' as const;
export const PackageBuildPhaseType_PackageWithOutput = 'package-with-output' as const;
export const PackageBuildPhaseType_Project = 'project' as const;

type BuildPhase_Base = {
	name: string,
	terminatingPhase?: boolean
	breakAfterPhase?: boolean
	mandatoryPhases?: BuildPhase[]
	isMandatory?: boolean
}
type BuildPhase_Package = BuildPhase_Base & {
	type: typeof PackageBuildPhaseType_Package;
	action: (pkg: RuntimePackage) => Promise<any>;
	filter?: (pkg: RuntimePackage) => Promise<boolean>
}

type BuildPhase_PackageWithOutput = BuildPhase_Base & {
	type: typeof PackageBuildPhaseType_PackageWithOutput;
	action: (pkg: RuntimePackage_WithOutput) => Promise<any>;
	filter?: (pkg: RuntimePackage_WithOutput) => Promise<boolean>
}

type BuildPhase_Project = BuildPhase_Base & {
	type: 'project';
	action: () => Promise<any>;
	filter?: () => Promise<boolean>
}

export type BuildPhase = BuildPhase_Package | BuildPhase_PackageWithOutput | BuildPhase_Project
const mapToName = (item: { name: string }) => item.name;

function resolveAllMandatoryPhases(phase: BuildPhase): BuildPhase[] {
	let result: BuildPhase[] = [phase];
	if (phase.mandatoryPhases) {
		for (const childPhase of phase.mandatoryPhases) {
			result = result.concat(resolveAllMandatoryPhases(childPhase));
		}
	}
	return filterDuplicates(result, result => result.name);
}

DebugFlag.DefaultLogLevel = LogLevel.Verbose;

export class ProjectManager
	extends Logger {

	private phases: BuildPhase[] = [];
	private dryRun = RuntimeParams.dryRun;
	private terminate = false;
	private prevRunningStatus?: RunningStatus;
	private readonly projectScreen: ProjectScreen;
	private logger?: LogClient;

	constructor() {
		super();
		this.projectScreen = new ProjectScreen([]);
		this.showAllLogs();
	}

	showAllLogs() {
		if (this.logger)
			BeLogged.removeConsole(this.logger);

		this.projectScreen?.disable();
		BeLogged.addClient(this.logger = LogClient_Terminal);
	}

	showPrettyLogs() {
		if (this.logger)
			BeLogged.removeConsole(this.logger);

		this.projectScreen.enable();
		BeLogged.addClient(this.logger = this.projectScreen.logClient);
	}

	private loadPackage() {
		const pathToConfig = convertToFullPath('./.config/project-config.ts');
		if (!fs.existsSync(pathToConfig))
			throw new ImplementationMissingException(`Missing ./.config/project-config.ts file, could not find in path: ${pathToConfig}`);

		const projectConfig = require(pathToConfig).default;

		const packages = mapProjectPackages(projectConfig);
		MemKey_Packages.set(packages);

		//Update UI with packages on first run
		if (!this.projectScreen.packageData.length) {
			packages.packagesDependency.map(packages => packages.map(pkg => this.projectScreen.updateOrCreatePackage(pkg.name, 'Initiated')));
		}
	}

	registerPhase(phase: BuildPhase) {
		this.phases.push(phase);
	}

	updateRunningStatus = async (runningStatus: RunningStatus = MemKey_RunningStatus.get(undefined)) => {
		if (!runningStatus)
			return;

		if (!fs.existsSync(Default_OutputFiles.output))
			await _fs.mkdir(Default_OutputFiles.output, {recursive: true});
		await _fs.writeFile(Default_OutputFiles.runningStatus, __stringify(runningStatus, true));
	};

	async prepare(phases = this.phases, index: number = 0) {
		const phasesToRun: BuildPhase[] = [];

		let i = index;
		for (; i < phases.length; i++) {
			const phase = phases[i];
			const isNotSamePackageType = phasesToRun[0] && phase.type !== phasesToRun[0].type;
			const isNextPhaseANoneValidProjectPackage = phase.type === 'project' && (phase.filter && !(await phase.filter()));
			if (isNotSamePackageType) {
				if (isNextPhaseANoneValidProjectPackage)
					continue;
				else
					break;
			}

			if (phase.type !== 'project' || (!phase.filter || await phase.filter?.()))
				phasesToRun.push(phase);

			if ((phasesToRun.length > 0 && phase.terminatingPhase) || phase.breakAfterPhase) {
				i++;
				break;
			}
		}

		if (!phasesToRun.length)
			return;

		const nextAction = await this.prepare(phases, i);
		this.logDebug('Scheduling phases: ', phasesToRun.map(mapToName));

		if (phasesToRun[0].type === 'project')
			return async () => {
				if (this.terminate)
					return this.logInfo(`Skipping project phases:`, phasesToRun.map(mapToName));

				let didRun = false;
				for (const phase of phasesToRun) {
					if (ProjectManager.isAborted())
						return;

					// if there's a previous running status and the current phase is the one to continue from clean
					if (this.prevRunningStatus && this.prevRunningStatus.phaseKey === phase.name)
						delete this.prevRunningStatus;

					// keep the current running status updated
					if (!this.prevRunningStatus && !phase.terminatingPhase)
						MemKey_RunningStatus.set({phaseKey: phase.name});

					this.logInfo(`Running project phase: ${phase.name}`);

					// if prev running status still exists skip execution
					if (this.prevRunningStatus && !phase.isMandatory) {
						this.logVerbose('Skipping duo continue');
						continue;
					}

					//Update project screen
					this.projectScreen?.updateRunningPhase(phase.name);

					if (this.dryRun) {
						await sleep(200);
					} else
						await (phase as BuildPhase_Project).action();

					didRun = true;

				}

				if (didRun && lastElement(phasesToRun)!.terminatingPhase)
					this.terminate = true;

				await nextAction?.();
			};

		return async () => {
			let didRun = false;
			let didPrintPhase = false;

			const toRunPackages = MemKey_Packages.get().packagesDependency.map((packages, i) => {
				return async () => {

					// if there's a previous running status and the current phase is the one to continue from clean
					if (phasesToRun.find(phase => phase.name === this.prevRunningStatus?.phaseKey) && i === this.prevRunningStatus?.packageDependencyIndex)
						delete this.prevRunningStatus;

					let didPrintPackages = false;
					const values = flatArray(packages.map(async pkg => {
						for (const phase of phasesToRun as BuildPhase_Package[]) {
							if (ProjectManager.isAborted())
								return;

							if (!(!phase.filter || await phase.filter(pkg)))
								continue;

							// keep the current running status updated
							if (!this.prevRunningStatus && !phase.terminatingPhase)
								MemKey_RunningStatus.set({phaseKey: phase.name, packageDependencyIndex: i});

							if (!didPrintPhase) {
								this.logInfo(`Running package phase: ${__stringify(phasesToRun.map(mapToName))}`);
								didPrintPhase = true;
							}

							if (!didPrintPackages) {
								this.logVerbose(` - on packages: ${__stringify(packages.map(mapToName))}`);
								didPrintPackages = true;
							}

							didRun = true;
							this.logDebug(`   - ${pkg.name}:${phase.name}`);

							//Update project screen
							this.projectScreen?.updateRunningPhase(phase.name);

							// if prev running status still exists skip execution
							if (this.prevRunningStatus && !phase.isMandatory) {
								continue;
							}

							// skip packages indexes
							const packageDependencyIndex = this.prevRunningStatus?.packageDependencyIndex ?? 0;
							if (packageDependencyIndex > i) {
								this.logVerbose('Skipping duo continue');
								this.projectScreen.updateOrCreatePackage(pkg.name, 'Skipped');
								continue;
							}

							if (this.dryRun) {
								await sleep(200);
							} else
								await phase.action(pkg);

						}
					}));

					await Promise.all(values);
				};
			});

			if (this.terminate)
				return this.logInfo(`Skipping packages phases:`, phasesToRun.map(mapToName));

			for (const toRunPackage of toRunPackages) {
				await toRunPackage();
			}

			if (didRun && lastElement(phasesToRun)!.terminatingPhase)
				this.terminate = true;

			await nextAction?.();
		};
	}

	private static isAborted() {
		try {
			return MemKey_AbortSignal.get().aborted;
		} catch (e) {
			return false;
		}
	}

	async execute(phases = this.phases, prevRunningStatus?: RunningStatus, signal?: AbortSignal) {
		return new MemStorage().init(async () => {
			//Update the project manager mem key to be used elsewhere in the project
			MemKey_ProjectManager.set(this);

			MemKey_DefaultFiles.set(Default_Files);

			// Set default value to memKey
			MemKey_RunningStatus.set({phaseKey: ''});

			//Set project screen
			MemKey_ProjectScreen.set(this.projectScreen);

			const listener = async (status: string) => {
				this.logDebug('SIGINT - running status:', status);
				await this.updateRunningStatus();
				process.exit(0);
			};
			process.on('SIGINT', listener);

			try {
				if (RuntimeParams.continue)
					this.prevRunningStatus = JSON.parse(await _fs.readFile(Default_OutputFiles.runningStatus, {encoding: 'utf-8'}));
			} catch (e: any) {
				this.logError('Failed reading running status', e);
			}

			this.loadPackage();

			if (signal)
				MemKey_AbortSignal.set(signal);

			// update prev running status if passed
			if (prevRunningStatus) {
				this.logWarning('Setting prev running status: ', prevRunningStatus);
				this.prevRunningStatus = prevRunningStatus;
			}

			try {
				await (await this.prepare(phases))!();
			} catch (e: any) {
				this.logError(e);
			}

			MemKey_ProjectScreen.get().endRun();
			process.off('SIGINT', listener);
			await this.updateRunningStatus();
		});
	}

	async executePhase(phaseKey: string, prevRunningStatus?: RunningStatus, signal?: AbortSignal) {
		const phase = this.phases.find(phase => phase.name === phaseKey);
		if (!phase)
			throw new BadImplementationException(`No Such Phase: ${phaseKey}`);

		const finalPhasesToRun = resolveAllMandatoryPhases(phase).reverse();
		return this.execute(finalPhasesToRun, prevRunningStatus, signal);
	}

}