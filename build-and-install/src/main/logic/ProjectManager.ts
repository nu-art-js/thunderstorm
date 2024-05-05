import {
	PackageType,
	PackageType_Sourceless,
	PackageTypesWithOutput,
	ProjectConfig,
	RuntimePackage,
	RuntimePackage_WithOutput,
	RuntimeProjectConfig
} from '../core/types';
import {CliError} from '@nu-art/commando/core/CliError';
import {BeLogged, filterDuplicates, filterInstances, LogClient_Terminal, Logger, LogLevel} from '@nu-art/ts-common';


export const PackageBuildPhaseType_Package = 'package' as const;
export const PackageBuildPhaseType_PackageWithOutput = 'package-with-output' as const;
export const PackageBuildPhaseType_Project = 'project' as const;
const PackageBuildPhaseTypes = [PackageBuildPhaseType_Package, PackageBuildPhaseType_PackageWithOutput, PackageBuildPhaseType_Project] as const;
type PackageBuildPhaseType = typeof PackageBuildPhaseTypes[number];

type BuildPhase_Base = {
	name: string,
	terminatingPhase?: boolean
	mandatoryPhases?: BuildPhase[]
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

export class ProjectManager
	extends Logger {

	private phases: BuildPhase[] = [];
	private config: RuntimeProjectConfig;

	constructor(config: ProjectConfig) {
		super();
		this.config = config;
		BeLogged.addClient(LogClient_Terminal);
		this.setMinLevel(LogLevel.Verbose);
	}

	registerPhase(phase: BuildPhase) {
		this.phases.push(phase);
	}

	async execute(phasesToRun?: BuildPhase[]) {
		for (const phase of (phasesToRun ?? this.phases)) {
			const didRun = await this.runPhase(phase);

			//terminate execution if phase is terminating
			if (didRun && phase.terminatingPhase)
				break;
		}
	}

	private resolveAllMandatoryPhases(phase: BuildPhase): BuildPhase[] {
		let result: BuildPhase[] = [phase];
		if (phase.mandatoryPhases) {
			for (const childPhase of phase.mandatoryPhases) {
				result = result.concat(this.resolveAllMandatoryPhases(childPhase));
			}
		}
		return filterDuplicates(result, result => result.name);
	}

	async runPhaseByKey(phaseKey: string) {
		const phase = this.phases.find(phase => phase.name === phaseKey);
		if (!phase)
			return;

		const finalPhasesToRun = this.resolveAllMandatoryPhases(phase).reverse();
		return this.execute(finalPhasesToRun);
	}

	private getPackagesForPhaseType = (phaseType: PackageBuildPhaseType) => {
		const allRuntimePackages: RuntimePackage[] = [];
		this.config.packagesDependency?.forEach(dependency => dependency.forEach(_package => allRuntimePackages.push(_package)));
		switch (phaseType) {
			case PackageBuildPhaseType_Project:
				return [];

			case PackageBuildPhaseType_Package:
				return allRuntimePackages;

			case PackageBuildPhaseType_PackageWithOutput:
				return allRuntimePackages.filter(_package => {
					const packageType = _package.type as Exclude<PackageType, typeof PackageType_Sourceless>;
					return PackageTypesWithOutput.includes(packageType);
				});

			default:
				return allRuntimePackages;
		}
	};

	private async runPhase(phase: BuildPhase) {
		if (phase.type === PackageBuildPhaseType_Project) {
			if (!phase.filter || await phase.filter()) {
				this.logInfo(`Running project phase: ${phase.name}`);
				await phase.action();
				return true;
			}

			this.logVerbose(`Skipping project phase: ${phase.name}`);
			return false;
		}

		const relevantPackages = this.getPackagesForPhaseType(phase.type);
		if (relevantPackages.length === 0)
			return false;

		let didPrint = false;
		let didRun = false;
		for (const packages of this.config.packagesDependency ?? []) {
			const packagesToCheck = packages.filter(pkg => relevantPackages.includes(pkg)) as RuntimePackage_WithOutput[];
			const filteredPackages = filterInstances(await Promise.all(packagesToCheck.map(async pkg => {
				if (!phase.filter || await phase.filter(pkg))
					return pkg;
			})));

			const finalPackages = filteredPackages.filter(pkg => pkg) as RuntimePackage_WithOutput[];
			if (finalPackages.length === 0)
				continue;

			if (!didPrint) {
				this.logInfo(`Running phase: ${phase.name}`);
				didPrint = true;
			}

			if (finalPackages.length === 1)
				this.logDebug(`  Package: ${packagesToCheck.map(pkg => pkg.name)[0]}`);
			else
				this.logDebug(`  Packages: ${JSON.stringify(packagesToCheck.map(pkg => pkg.name))}`);

			const errors = await Promise.all(finalPackages.map(async pkg => {
				try {
					await phase.action(pkg);
					didRun = true;
				} catch (e: any) {
					return e as CliError;
				}
			}));

			if (filterInstances(errors).length > 0) {
				errors.forEach((error, index) => {
					if (!error)
						return;

					this.logError(`\nError in package: ${packages[index].packageJsonTemplate?.name}`);

					if (error.stdout?.length)
						this.logVerbose(error.stdout);
					if (error.stderr?.length)
						this.logVerboseBold(error.stderr);
					else if (error.message?.length)
						this.logError(error.message);
				});
				throw new Error(`${filterInstances(errors).length} Errors in phase "${phase.name}"`);
			}
		}
		return didRun;
		// throw new Error(`Unknown phase type '${JSON.stringify(phase)}'`);
	}
}