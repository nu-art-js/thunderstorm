import {CustomException, isErrorOfType, Logger} from '@nu-art/ts-common';
import {ScheduledStep} from '../../phases/PhaseManager.js';
import {UnitPhaseException} from './UnitPhaseException.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';

export class PhaseAggregatedException
	extends CustomException {
	errors: UnitPhaseException[];

	constructor(errors: UnitPhaseException[], step: ScheduledStep) {
		super(PhaseAggregatedException, `One or more errors occurred in step execution: ${JSON.stringify(step)}`);
		// @ts-ignore
		this.errors = errors;
	}

	print(logger: Logger) {
		logger.logError(this.message);
		this.errors.forEach(error => {
			const commandoError = isErrorOfType(error, CommandoException);
			if (commandoError) {
				logger.logWarning(`message: ${commandoError.message}`);
				commandoError.cause && logger.logWarning('caused by: ', commandoError.cause);
				logger.logError('stdout: ', commandoError.stdout);
				logger.logError('stderr', commandoError.stderr);
				return;
			}

			logger.logWarning('error: ', error);
		});
	}
}
