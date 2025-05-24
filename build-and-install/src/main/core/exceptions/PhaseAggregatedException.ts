import {CustomException} from '@nu-art/ts-common';
import {ScheduledStep} from '../../v3/PhaseManager';

export class PhaseAggregatedException
	extends CustomException {

	constructor(errors: Error[], step: ScheduledStep) {
		super(PhaseAggregatedException, `One or more errors occurred in step execution: ${JSON.stringify(step)}`);
		// @ts-ignore
		this.cause = errors;
	}
}
