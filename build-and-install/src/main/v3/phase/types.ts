import {BaiParams} from '../../core/params/params';
import {BaseUnit} from '../units';
import {AsyncVoidFunction} from '@nu-art/ts-common';

export type Phase<PhaseMethod extends string> = {
	//Key identifier of the phase, Unique
	key: string;
	//Name of the phase - to be displayed in the runner status
	name: string
	//The method in the units that this phase is demanding be implemented
	method: PhaseMethod
	//Filter to determine if the phase will run
	filter?: (params: BaiParams) => (Promise<boolean> | boolean);
	//Filter units for this phase
	unitFilter?: (unit: BaseUnit) => (Promise<boolean> | boolean)
	//Should the runner terminate after the phase, only matters if the phase did run
	terminateAfterPhase?: boolean;
	//Should this phase be run taking into account the dependency tree
	runUnitsInDependency?: boolean;
	//Phases that are dependency of this phase and must run for this phase to work
	dependencyPhase?: Phase<string>[];

	// should the operation break the phases sequence
	breakPhases?: boolean;
}

export type PhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]: AsyncVoidFunction;
}

export type PhasesImplementor<Phases extends Phase<string>[]> = {
	[K in Phases[number]['method']]?: AsyncVoidFunction
}
