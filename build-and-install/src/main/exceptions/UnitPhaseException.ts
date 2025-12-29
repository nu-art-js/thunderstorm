import {CustomException} from '@nu-art/ts-common';
import {BaseUnit} from '../units/index.js';

export class UnitPhaseException
	extends CustomException {

	constructor(cause: Error, unit: BaseUnit, phase: string) {
		super(UnitPhaseException, `Error in ${unit.config.key} (${phase})`, cause);
	}
}
