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

import {Module} from './module.js';
import {Dispatcher} from './dispatcher.js';
import {CustomException} from './exceptions/exceptions.js';

/**
 * Severity levels for server errors, ordered from least to most severe.
 */
export enum ServerErrorSeverity {
	Debug    = 'Debug',
	Info     = 'Info',
	Warning  = 'Warning',
	Error    = 'Error',
	Critical = 'Critical',
}

/**
 * Array of error severities in ordinal order (least to most severe).
 * Useful for comparisons and sorting.
 */
export const ServerErrorSeverity_Ordinal = [
	ServerErrorSeverity.Debug,
	ServerErrorSeverity.Info,
	ServerErrorSeverity.Warning,
	ServerErrorSeverity.Error,
	ServerErrorSeverity.Critical
];

/**
 * Structure for error messages that may contain nested messages.
 */
export type ErrorMessage = {
	/** Primary error message */
	message: string,
	/** Optional array of nested/inner error messages */
	innerMessages?: string[]
}

/**
 * Interface for modules that handle application notifications.
 *
 * Modules implementing this interface will receive notifications about
 * application-level events (errors, warnings, etc.) via the dispatcher.
 */
export interface OnApplicationNotification {
	/**
	 * Processes an application notification.
	 *
	 * @param errorLevel - Severity level of the notification
	 * @param module - The module that generated the notification
	 * @param message - Error message structure
	 */
	__processApplicationNotification(errorLevel: ServerErrorSeverity, module: Module, message: ErrorMessage): Promise<void>;
}

/**
 * Dispatcher for application notifications.
 *
 * Use this to notify all modules that implement `OnApplicationNotification`
 * about application-level events.
 */
export const dispatch_onApplicationNotification = new Dispatcher<OnApplicationNotification, '__processApplicationNotification'>('__processApplicationNotification');

/**
 * Interface for modules that handle application exceptions.
 *
 * Modules implementing this interface will receive exceptions that occur
 * at the application level via the dispatcher.
 */
export interface OnApplicationException {
	/**
	 * Processes an application exception.
	 *
	 * @param e - The exception that occurred
	 * @param module - The module where the exception occurred
	 */
	__processApplicationException(e: CustomException, module: Module): Promise<void>;
}

/**
 * Dispatcher for application exceptions.
 *
 * Use this to notify all modules that implement `OnApplicationException`
 * about exceptions that occur at the application level.
 */
export const dispatch_onApplicationException = new Dispatcher<OnApplicationException, '__processApplicationException'>('__processApplicationException');
