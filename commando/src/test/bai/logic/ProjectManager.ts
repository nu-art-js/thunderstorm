import {filterInstances} from '../core/tools';
import {CliError} from '../../../main/core/CliError';
import {PackageType, PackageType_Sourceless, PackageTypesWithOutput, ProjectConfig, RuntimePackage, RuntimePackage_WithOutput} from '../core/types';

export const PackageBuildPhaseType_Package = 'package' as const;
export const PackageBuildPhaseType_PackageWithOutput = 'package-with-output' as const;
export const PackageBuildPhaseType_Project = 'project' as const;
const PackageBuildPhaseTypes = [PackageBuildPhaseType_Package, PackageBuildPhaseType_PackageWithOutput, PackageBuildPhaseType_Project] as const;
type PackageBuildPhaseType = typeof PackageBuildPhaseTypes[number];

type BuildPhase_Base = {
	name: string,
}
type BuildPhase_Package = BuildPhase_Base & {
	type: typeof PackageBuildPhaseType_Package;
	action: (pkg: RuntimePackage) => Promise<any>;
}

type BuildPhase_PackageWithOutput = BuildPhase_Base & {
	type: typeof PackageBuildPhaseType_PackageWithOutput;
	action: (pkg: RuntimePackage_WithOutput) => Promise<any>;
}

type BuildPhase_Project = BuildPhase_Base & {
	type: 'project';
	action: () => Promise<any>;
}

type BuildPhase = BuildPhase_Package | BuildPhase_PackageWithOutput | BuildPhase_Project

export class ProjectManager {

	private phases: BuildPhase[] = [];
	private config: ProjectConfig;

	constructor(config: ProjectConfig) {
		this.config = config;
	}

	registerPhase(phase: BuildPhase) {
		this.phases.push(phase);
	}

	async execute() {
		for (const phase of this.phases) {
			await this.runPhase(phase);
		}
	}

	async runPhaseByKey(phaseKey: string) {
		const phase = this.phases.find(phase => phase.name === phaseKey);
		if (!phase)
			return;

		return this.runPhase(phase);
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
					PackageTypesWithOutput.includes(packageType);
				});

			default:
				return allRuntimePackages;
		}
	};

	private async runPhase(phase: BuildPhase) {
		console.log(`in phase: ${phase.name} `);

		if (phase.type === PackageBuildPhaseType_Project)
			return phase.action();

		const relevantPackages = this.getPackagesForPhaseType(phase.type);

		for (const packages of this.config.packagesDependency ?? []) {
			const packagesToCheck = packages.filter(pkg => relevantPackages.includes(pkg)) as RuntimePackage_WithOutput[];
			const errors = await Promise.all(packagesToCheck.map(async pkg => {
				try {
					await phase.action(pkg);
				} catch (e: any) {
					return e as CliError;
				}
			}));

			if (filterInstances(errors).length > 0) {
				errors.forEach((error, index) => {
					if (!error)
						return;

					console.log(`\nError in package: ${packages[index].packageJson?.name}`);

					if (error.stdout?.length)
						console.log(error.stdout);
					if (error.stderr?.length)
						console.error(error.stderr);
					else if (error.message?.length)
						console.error(error.message);
				});
				throw new Error(`${filterInstances(errors).length} Errors in phase "${phase.name}"`);
			}
		}
		return;

		// throw new Error(`Unknown phase type '${JSON.stringify(phase)}'`);

	}
}