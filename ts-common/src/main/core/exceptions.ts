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
import {Constructor} from '../utils/types';


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
export function isErrorOfType<T extends Error>(e: Error, _exceptionType: Constructor<T>): T | undefined {
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

/**
 * # <ins>DontCallthisException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "DontCallthisException",
 * @category Exceptions
 */
export class DontCallthisException
    extends CustomException {

    constructor(message: string, cause?: Error) {
        super(DontCallthisException, message, cause);
    }
}

/**
 * # <ins>WhoCallthisException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "WhoCallthisException",
 * @category Exceptions
 */
export class WhoCallthisException
    extends CustomException {

    constructor(message: string, cause?: Error) {
        super(WhoCallthisException, message, cause);
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