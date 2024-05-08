import {RuntimePackage, RuntimePackage_WithOutput} from '../core/types';
import {
	__stringify,
	BadImplementationException,
	BeLogged,
	filterDuplicates,
	flatArray,
	ImplementationMissingException,
	lastElement,
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
import {
	Default_Files,
	Default_OutputFiles,
	MemKey_DefaultFiles,
	MemKey_RunningStatus,
	RunningStatus
} from '../defaults/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_ProjectManager} from '../project-manager';


export const PackageBuildPhaseType_Package = 'package' as const;
export const PackageBuildPhaseType_PackageWithOutput = 'package-with-output' as const;
export const PackageBuildPhaseType_Project = 'project' as const;

type BuildPhase_Base = {
	name: string,
	terminatingPhase?: boolean
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

export class ProjectManager
	extends Logger {

	private phases: BuildPhase[] = [];
	private dryRun = RuntimeParams.dryRun;
	private terminate = false;
	private prevRunningStatus?: RunningStatus;

	constructor() {
		super();
		BeLogged.addClient(LogClient_Terminal);
		this.setMinLevel(LogLevel.Verbose);
	}

	private async init() {
		MemKey_DefaultFiles.set(Default_Files);

		//Update the project manager mem key to be used elsewhere in the project
		MemKey_ProjectManager.set(this);

		// Set default value to memKey
		MemKey_RunningStatus.set({phaseKey: ''});

		try {
			if (RuntimeParams.continue)
				this.prevRunningStatus = JSON.parse(await _fs.readFile(Default_OutputFiles.runningStatus, {encoding: 'utf-8'}));
		} catch (e: any) {
			this.logError('Failed reading running status', e);
		}

		this.loadPackage();
	}

	private loadPackage() {
		const pathToConfig = convertToFullPath('./.config/project-config.ts');
		if (!fs.existsSync(pathToConfig))
			throw new ImplementationMissingException(`Missing ./.config/project-config.ts file, could not find in path: ${pathToConfig}`);

		const projectConfig = require(pathToConfig).default;

		const packages = mapProjectPackages(projectConfig);
		MemKey_Packages.set(packages);
	}

	registerPhase(phase: BuildPhase) {
		this.phases.push(phase);
	}

	private updateRunningStatus = async (runningStatus: RunningStatus = MemKey_RunningStatus.get(undefined)) => {
		if (runningStatus)
			return _fs.writeFile(Default_OutputFiles.runningStatus, __stringify(runningStatus, true));
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

			if (phasesToRun.length > 0 && phase.terminatingPhase) {
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
					// if there's a previous running status and the current phase is the one to continue from clean
					if (this.prevRunningStatus && this.prevRunningStatus.phaseKey === phase.name)
						delete this.prevRunningStatus;

					// keep the current running status updated
					if (!this.prevRunningStatus)
						MemKey_RunningStatus.set({phaseKey: phase.name});

					this.logInfo(`Running project phase: ${phase.name}`);

					// if prev running status still exists skip execution
					if (this.prevRunningStatus && !phase.isMandatory) {
						this.logVerbose('Skipping duo continue');
						continue;
					}

					if (this.dryRun) {
						await sleep(200);
					} else
						await (phase as BuildPhase_Project).action();

					didRun = true;

					//update running status
					await this.updateRunningStatus();
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
					if (this.prevRunningStatus && this.prevRunningStatus.phaseKey === phasesToRun[0].name && i === this.prevRunningStatus.packageDependencyIndex)
						delete this.prevRunningStatus;

					// keep the current running status updated
					if (!this.prevRunningStatus)
						MemKey_RunningStatus.set({phaseKey: phasesToRun[0].name, packageDependencyIndex: i});

					let didPrintPackages = false;
					const values = flatArray(packages.map(async pkg => {
						for (const phase of phasesToRun as BuildPhase_Package[]) {
							if (!(!phase.filter || await phase.filter(pkg)))
								continue;

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

							// if prev running status still exists skip execution
							if (this.prevRunningStatus && !phase.isMandatory) {
								this.logVerbose('Skipping duo continue');
								continue;
							}

							if (this.dryRun) {
								await sleep(200);
							} else
								await phase.action(pkg);

							// save the running status post action execution
							await this.updateRunningStatus();
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

	async execute(phases = this.phases) {
		return new MemStorage().init(async () => {
			await this.init();
			return (await this.prepare(phases))!();
		});
	}

	async executePhase(phaseKey: string, prevRunningStatus?: RunningStatus) {
		const phase = this.phases.find(phase => phase.name === phaseKey);
		if (!phase)
			throw new BadImplementationException(`No Such Phase: ${phaseKey}`);

		// update prev running status if passed
		if (prevRunningStatus)
			this.prevRunningStatus = prevRunningStatus;

		const finalPhasesToRun = resolveAllMandatoryPhases(phase).reverse();
		return this.execute(finalPhasesToRun);
	}

}
