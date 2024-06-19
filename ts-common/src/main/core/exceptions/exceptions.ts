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
import {ApiError_GeneralErrorMessage, ApiErrorResponse, ResponseError} from './types';
import {Constructor, UniqueId} from '../../utils/types';
import {_logger_logException} from '../logger/utils';


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
export abstract class CustomException
	extends Error {

	public exceptionType: string;

	public isInstanceOf: (_exceptionType: Function) => boolean;

	public generateMrkDwnMessage: () => string;

	public cause?: Error;

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
 * # <ins>Exception</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "Exception",
 * @category Exceptions
 */
export class Exception
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(Exception, message, cause);
	}
}

/**
 * # <ins>BadImplementationException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "BadImplementationException",
 * @category Exceptions
 */
export class BadImplementationException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(BadImplementationException, message, cause);
	}
}

/**
 * # <ins>ImplementationMissingException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "ImplementationMissingException",
 * @category Exceptions
 */
export class ImplementationMissingException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(ImplementationMissingException, message, cause);
	}
}

/**
 * # <ins>MUSTNeverHappenException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "MUSTNeverHappenException",
 * @category Exceptions
 */
export class MUSTNeverHappenException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(MUSTNeverHappenException, message, cause);
	}
}

/**
 * # <ins>NotImplementedYetException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "NotImplementedYetException",
 * @category Exceptions
 */
export class NotImplementedYetException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(NotImplementedYetException, message, cause);
	}
}

/**
 * # <ins>ThisShouldNotHappenException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "ThisShouldNotHappenException",
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

export class ApiException<Err extends ResponseError = ApiError_GeneralErrorMessage>
	extends CustomException {

	public readonly responseBody: ApiErrorResponse<Err> = {};
	public readonly responseCode: number;

	public readonly setErrorBody = (errorBody: Err) => {
		this.responseBody.error = errorBody;
		return this;
	};

	constructor(responseCode: number, causeOrMessage?: string | Error, cause?: Error) {
		super(ApiException, `${responseCode}${ApiException.getMessage(causeOrMessage)}`, ApiException.getCause(causeOrMessage, cause));

		this.responseCode = responseCode;
		this.responseBody.debugMessage = _logger_logException(this);
	}

	private static getMessage(causeOrMessage?: string | Error) {
		return typeof causeOrMessage === 'string' ? `-${JSON.stringify(causeOrMessage)}` : '';
	}

	private static getCause(causeOrMessage?: string | Error, cause?: Error) {
		return typeof causeOrMessage != 'string' ? causeOrMessage : cause;
	}
}


