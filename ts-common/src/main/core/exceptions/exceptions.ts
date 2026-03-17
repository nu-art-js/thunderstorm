/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Created by TacB0sS on 3/16/17.
 */

// noinspection TypeScriptPreferShortImport
import {ApiError_GeneralErrorMessage, ApiErrorResponse, ResponseError} from './types.js';
import {Constructor, UniqueId} from '../../utils/types.js';
import {_logger_logException} from '../logger/index.js';


/**
 * # <ins>isErrorOfType</ins>
 *
 * A function that checks if an error is of a certain type.
 *
 * @param e The error
 * @param _exceptionType The exception class to compare to
 *
 * @returns
 * - T - The error as the type checked if the error was of that type.
 * - undefined - otherwise.
 *
 * #### <ins>Usage:</ins>
 * ```js
 * try {
 *   ...
 * } catch(e: Error) {
 *   if(isErrorOfType(e,ThisShouldNotHappenException)) {
 *     e = new ThisShouldNotHappenException("this should not have happened",e);
 *     ...
 *   }
 * }
 * ```
 */
export function isErrorOfType<T extends Error>(e: Error | unknown, _exceptionType: Constructor<T>): T | undefined {
	const _e = e as any;
	if (_e.isInstanceOf?.(_exceptionType))
		return e as T;
}

/**
 * # CustomException
 *
 * ### <ins>Intro</ins>
 * An abstract class defining the structure of custom exceptions.<br>
 * This class extends the java-script native Error object.<br>
 * In addition to collecting the error, this class also collects a message and the exception type, for better
 * error handling.<br>
 *
 * @category Exceptions
 */
/**
 * Base class for all custom exceptions in the nu-art ecosystem.
 *
 * Extends the native Error class and adds:
 * - Type identification via `exceptionType` (class name)
 * - Runtime type checking via `isInstanceOf()` method
 * - Markdown message generation for reporting
 * - Optional cause chain for error tracking
 *
 * **Important**: The `stack` property is set from a new Error instance to ensure
 * proper stack trace capture at the point of exception creation.
 *
 * @category Exceptions
 */
export abstract class CustomException
	extends Error {

	/** The name of the exception class (e.g., "BadImplementationException") */
	public exceptionType: string;

	/**
	 * Runtime type checker that compares exception types by class name.
	 * Works with `isErrorOfType()` for type-safe error handling.
	 */
	public isInstanceOf: (_exceptionType: Function) => boolean;

	/** Generates a markdown-formatted error message for reporting */
	public generateMrkDwnMessage: () => string;

	/** Optional underlying error that caused this exception (error chaining) */
	public cause?: Error;

	/**
	 * Creates a new CustomException instance.
	 *
	 * @param exceptionType - The exception class constructor (used to extract the class name)
	 * @param message - Human-readable error message
	 * @param cause - Optional underlying error that caused this exception
	 */
	protected constructor(exceptionType: Function, message: string, cause?: Error) {
		super(message);
		this.message = message;
		this.stack = (new Error(message)).stack;
		this.cause = cause;
		this.exceptionType = exceptionType.name;
		this.isInstanceOf = (_exceptionType: Function): boolean => {
			return this.exceptionType === _exceptionType.name;
		};
		this.generateMrkDwnMessage = () => {
			return `*Exception Type :* ${this.exceptionType}\n`
				+ `*Message :* ${this.message}`;
		};
	}
}

/**
 * Generic exception class for general error conditions.
 *
 * Use this for errors that don't fit into more specific exception categories.
 * For more specific cases, prefer the specialized exception classes.
 *
 * @category Exceptions
 */
export class Exception
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(Exception, message, cause);
	}
}

/**
 * Thrown when code is implemented incorrectly or violates design constraints.
 *
 * Use this for programming errors, incorrect API usage, or violations of
 * architectural rules (e.g., module naming conventions, singleton violations).
 *
 * @category Exceptions
 */
export class BadImplementationException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(BadImplementationException, message, cause);
	}
}

/**
 * Thrown when required functionality has not been implemented.
 *
 * Use this when code expects an implementation that is missing (e.g., abstract
 * method not overridden, required module not registered).
 *
 * @category Exceptions
 */
export class ImplementationMissingException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(ImplementationMissingException, message, cause);
	}
}

/**
 * Thrown when a condition that MUST never occur is detected.
 *
 * Use this for critical invariants that, if violated, indicate a serious bug
 * or system corruption. This is stronger than `ThisShouldNotHappenException`.
 *
 * @category Exceptions
 */
export class MUSTNeverHappenException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(MUSTNeverHappenException, message, cause);
	}
}

/**
 * Thrown when functionality is planned but not yet implemented.
 *
 * Use this for placeholder code or features that are in development.
 * This is different from `ImplementationMissingException` which indicates
 * a missing required implementation.
 *
 * @category Exceptions
 */
export class NotImplementedYetException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(NotImplementedYetException, message, cause);
	}
}

/**
 * Thrown when an unexpected but potentially recoverable condition occurs.
 *
 * Use this for conditions that shouldn't happen under normal circumstances
 * but might occur due to edge cases or external factors. Less severe than
 * `MUSTNeverHappenException`.
 *
 * @category Exceptions
 */
export class ThisShouldNotHappenException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(ThisShouldNotHappenException, message, cause);
	}
}

export type DependencyConflicts = {
	collectionKey: string;
	conflictingIds: UniqueId[];
}

/**
 * #<ins>EntityHasDependencies</ins>
 * This class inherits {@link CustomException} and represents an error of a entity trying to be deleted that has dependencies
 * @category Exceptions
 */
export class HasDependenciesException
	extends CustomException {

	public body?: DependencyConflicts[];
	public entityName?: string;
	public responseCode?: number;

	constructor(debugMessage: string, body?: DependencyConflicts[], entityName?: UniqueId, e?: Error) {
		super(HasDependenciesException, debugMessage, e);

		this.body = body;
		this.entityName = entityName;
	}
}

/**
 * # <ins>DontCallthisException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "DontCallthisException",
 * @category Exceptions
 */
export class DontCallThisException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(DontCallThisException, message, cause);
	}
}

/**
 * # <ins>WhoCallthisException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "WhoCallthisException",
 * @category Exceptions
 */
export class WhoCallThisException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(WhoCallThisException, message, cause);
	}
}

/**
 * When config for components or modules is missing
 */
export class ConfigMissingException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(ConfigMissingException, message, cause);
	}
}

/**
 * When a mandatory field is missing in an object when the object is fetched
 */
export class MissingDataException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(MissingDataException, message, cause);
	}
}

/**
 * When attempting to perform an action without the necessary permission
 */
export class MissingPermissionException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(MissingPermissionException, message, cause);
	}
}

/**
 * # <ins>AssertionException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "AssertionException",
 * @category Exceptions
 */
export class AssertionException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(AssertionException, message, cause);
	}
}

/**
 * Exception class for API errors with HTTP response codes and structured error bodies.
 *
 * Used for errors that need to be returned to API clients with:
 * - HTTP status code
 * - Structured error response body
 * - Debug message for server-side logging
 *
 * The constructor accepts `causeOrMessage` as either a string (message) or Error (cause),
 * allowing flexible error construction. If both `causeOrMessage` (as Error) and `cause`
 * are provided, `causeOrMessage` takes precedence.
 *
 * @template Err - Type of the error body (must extend ResponseError)
 *
 * @category Exceptions
 *
 * @example
 * ```typescript
 * // With message string
 * throw new ApiException(404, 'Resource not found');
 *
 * // With cause Error
 * throw new ApiException(500, originalError);
 *
 * // With both message and cause
 * throw new ApiException(400, 'Invalid input', validationError);
 * ```
 */
export class ApiException<Err extends ResponseError = ApiError_GeneralErrorMessage>
	extends CustomException {

	/** Structured error response body for API clients */
	public readonly responseBody: ApiErrorResponse<Err> = {};
	/** HTTP status code for the error response */
	public readonly responseCode: number;

	/**
	 * Sets the error body and returns this instance for method chaining.
	 *
	 * @param errorBody - Error body object to include in the response
	 * @returns This instance for chaining
	 */
	public readonly setErrorBody = (errorBody: Err) => {
		this.responseBody.error = errorBody;
		return this;
	};

	/**
	 * Creates a new ApiException.
	 *
	 * @param responseCode - HTTP status code (e.g., 404, 500)
	 * @param causeOrMessage - Either a message string or an Error object (as cause)
	 * @param cause - Optional additional cause Error (only used if causeOrMessage is a string)
	 */
	constructor(responseCode: number, causeOrMessage?: string | Error, cause?: Error) {
		super(ApiException, `${responseCode}${ApiException.getMessage(causeOrMessage)}`, ApiException.getCause(causeOrMessage, cause));

		this.responseCode = responseCode;
		this.responseBody.debugMessage = _logger_logException(this);
	}

	/**
	 * Extracts message string from causeOrMessage if it's a string.
	 */
	private static getMessage(causeOrMessage?: string | Error) {
		return typeof causeOrMessage === 'string' ? `-${JSON.stringify(causeOrMessage)}` : '';
	}

	/**
	 * Extracts cause Error from parameters.
	 * If causeOrMessage is an Error, it's used as the cause.
	 * Otherwise, the cause parameter is used.
	 */
	private static getCause(causeOrMessage?: string | Error, cause?: Error) {
		return typeof causeOrMessage != 'string' ? causeOrMessage : cause;
	}
}


