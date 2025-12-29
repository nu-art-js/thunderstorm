import {BaiParams} from '../../core/params.js';

export type Phase<PhaseMethod extends string> = {
	//Key identifier of the phase, Unique
	key: string;
	//Name of the phase - to be displayed in the runner status
	name: string
	//The method in the units that this phase is demanding be implemented
	method: PhaseMethod
	//Filter to determine if the phase will run
	filter?: (params: BaiParams) => boolean;
	//Should the runner terminate after the phase, only matters if the phase did run
	terminateAfterPhase?: boolean;
	//Phases that are dependency of this phase and must run for this phase to work
	dependencyPhase?: Phase<string>[];
	//Unit category determines which units participate in this phase
	//"project" = all project units (active + dependencies), "active" = only active units (default)
	unitCategory?: "project" | "active";
}
