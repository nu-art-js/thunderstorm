import { Phase, PhasesImplementor } from "./phase-runner/types";

export class ProjectManagerV2<Phases extends Phase<string>[]> {
	private manageables: PhasesImplementor<Phases>[] = [];
	phases: Phase<string>[] = [];

	constructor(...phases: Phases) {
		this.phases = phases;
	}

	register(item: PhasesImplementor<Phases>) {
		this.manageables.push(item);
		return this;
	}

	async execute() {
		for (const phase of this.phases) {
			for (const manageable of this.manageables) {
				await manageable[phase.method as keyof PhasesImplementor<Phases>]?.();
			}
		}
	}
}
