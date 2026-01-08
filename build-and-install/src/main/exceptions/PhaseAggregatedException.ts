import {CustomException, isErrorOfType, Logger} from '@nu-art/ts-common';
import {ScheduledStep} from '../phases/PhaseManager.js';
import {UnitPhaseException} from './UnitPhaseException.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';

/**
 * Exception thrown when one or more phases fail during execution.
 * 
 * **Aggregation**: Contains all `UnitPhaseException` errors from a failed step.
 * 
 * **Error Formatting**: The `print()` method provides detailed error output:
 * - For `CommandoException`: Shows message, cause, stdout, and stderr
 * - For other errors: Shows error object
 * 
 * **Usage**: Thrown by `PhaseManager.execute()` when any phase fails.
 */
export class PhaseAggregatedException
	extends CustomException {
	errors: UnitPhaseException[];

	/**
	 * Creates a new PhaseAggregatedException.
	 * 
	 * @param errors - Array of unit/phase errors that occurred
	 * @param step - The step that failed
	 */
	constructor(errors: UnitPhaseException[], step: ScheduledStep) {
		super(PhaseAggregatedException, `One or more errors occurred in step execution: ${JSON.stringify(step)}`);
		// @ts-ignore
		this.errors = errors;
	}

	/**
	 * Prints detailed error information to logger.
	 * 
	 * **Formatting**:
	 * - CommandoException: Shows message, cause, stdout, stderr
	 * - Other errors: Shows error object
	 * 
	 * @param logger - Logger to print errors to
	 */
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
