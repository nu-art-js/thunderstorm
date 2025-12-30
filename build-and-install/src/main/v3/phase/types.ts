import {BaiParams} from '../../core/params/params.js';

/**
 * Phase definition for build system execution.
 * 
 * **Phase Structure**:
 * - Phases are grouped into phase groups (arrays of phases)
 * - Phases in a group can run in parallel
 * - Phase groups run sequentially
 * 
 * **Key Properties**:
 * - `key`: Unique identifier for the phase
 * - `method`: Method name that units must implement (e.g., 'compile', 'test')
 * - `filter`: Optional function to determine if phase should run based on runtime params
 * - `unitCategory`: Which units participate ('active' or 'project')
 * - `dependencyPhase`: Phases that must complete before this phase runs
 * - `terminateAfterPhase`: If true, stops execution after this phase completes
 * 
 * **Unit Participation**:
 * - Units must implement the phase method to participate
 * - Units must be in the correct category (active/project)
 * - Phase filter must pass (if present)
 * 
 * **Examples**: See `phase/consts.ts` for all phase definitions.
 */
export type Phase<PhaseMethod extends string> = {
	/** Unique identifier for the phase */
	key: string;
	/** Display name for the phase */
	name: string
	/** Method name that units must implement */
	method: PhaseMethod
	/** Optional filter to determine if phase should run based on runtime params */
	filter?: (params: BaiParams) => boolean;
	/** If true, terminates execution after this phase completes */
	terminateAfterPhase?: boolean;
	/** Phases that must complete before this phase runs */
	dependencyPhase?: Phase<string>[];
	/** Unit category: 'project' = all project units (active + dependencies), 'active' = only active units (default) */
	unitCategory?: "project" | "active";
}
