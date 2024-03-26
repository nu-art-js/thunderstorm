import {PackageDetails, ProjectPackages} from '../core/types';


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
				await Promise.all(packages.map(pkg => phase.action(pkg)));
			}
			return;
		}

		throw new Error(`Unknown phase type '${JSON.stringify(phase)}'`);

	}
}