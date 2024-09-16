import {BaseUnit} from '../unit/core';

export type Phase<PhaseMethod extends string> = {
	//Key identifier of the phase, Unique
	key: string;
	//Name of the phase - to be displayed in the runner status
	name: string
	//The method in the units that this phase is demanding be implemented
	method: PhaseMethod
	//Filter to determine if the phase will run
	filter?: () => (Promise<boolean> | boolean);
	//Filter units for this phase
	unitFilter?: (unit: BaseUnit) => (Promise<boolean> | boolean)
	//Should the runner terminate after the phase, only matters if the phase did run
	terminateAfterPhase?: boolean;
	//Should this phase be run taking into account the dependency tree
	runUnitsInDependency?: boolean;
	//Phases that are dependency of this phase and must run for this phase to work
	dependencyPhaseKeys?: string[];

	// should the operation break the phases sequence
	breakPhases?: boolean;

}