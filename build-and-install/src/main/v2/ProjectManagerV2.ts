import {AsyncVoidFunction} from '@nu-art/ts-common';


export type PhasesImplementor<Phases extends Phase<string>[]> = {
	[K in Phases[number]['method']]?: AsyncVoidFunction
}

export type Phase<PhaseMethod extends string> = {
	name?: string
	method: PhaseMethod
}

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
