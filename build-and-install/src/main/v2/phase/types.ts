export type Phase<PhaseMethod extends string> = {
	//Name of the phase - to be displayed in the runner status
	name: string
	//The method in the units that this phase is demanding be implemented
	method: PhaseMethod
	//Filter to determine if the phase will run
	filter?: () => (Promise<boolean> | boolean);
	//Should the runner terminate after the phase, only matters if the phase did run
	terminateAfterPhase?:boolean;
}