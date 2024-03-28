import {PackageDetails, ProjectPackages} from '../core/types';
import {filterInstances} from '../core/tools';
import {CliError} from '../../../main/core/CliError';


type BuildPhase = {
	name: string,
}
type PackageBuildPhase = BuildPhase & {
	type: 'package'
	action: (pkg: PackageDetails) => Promise<any>
}
type ProjectBuildPhase = BuildPhase & {
	type: 'project'
	action: () => Promise<any>
}

export class ProjectManager {

	private phases: (ProjectBuildPhase | PackageBuildPhase)[] = [];
	private packagesDetails: ProjectPackages;

	constructor(packagesDetails: ProjectPackages) {
		this.packagesDetails = packagesDetails;
	}

	registerPhase(phase: ProjectBuildPhase | PackageBuildPhase) {
		this.phases.push(phase);
	}

	async execute() {
		for (const phase of this.phases) {
			await this.runPhase(phase);
		}
	}

	async runPhaseByKey(phaseKey: string) {
		return this.runPhase(this.phases.find(phase => phase.name === phaseKey));
	}

	private async runPhase(phase: ProjectBuildPhase | PackageBuildPhase) {
		console.log(`in phase: ${phase.name} `);
		if (phase.type === 'project') {
			return phase.action();
		}

		if (phase.type === 'package') {
			for (const packages of this.packagesDetails.packagesDependency) {
				const errors = await Promise.all(packages.map(async pkg => {
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

						console.log(`\nError in package: ${packages[index].packageJson.name}`);

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
		}

		throw new Error(`Unknown phase type '${JSON.stringify(phase)}'`);

	}
}