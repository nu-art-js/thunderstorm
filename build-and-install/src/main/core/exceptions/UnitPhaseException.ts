import {CustomException} from '@nu-art/ts-common';
import {BaseUnit} from '../../v3/units/index.js';

/**
 * Exception thrown when a specific phase fails on a specific unit.
 * 
 * **Context**: Contains the unit and phase that failed, along with the underlying error.
 * 
 * **Usage**: Created by `PhaseManager.execute()` when a phase method throws an error.
 * Multiple `UnitPhaseException`s are aggregated into `PhaseAggregatedException`.
 */
export class UnitPhaseException
	extends CustomException {

	/**
	 * Creates a new UnitPhaseException.
	 * 
	 * @param cause - The underlying error that occurred
	 * @param unit - The unit that failed
	 * @param phase - The phase key that failed
	 */
	constructor(cause: Error, unit: BaseUnit, phase: string) {
		super(UnitPhaseException, `Error in ${unit.config.key} (${phase})`, cause);
	}
}
