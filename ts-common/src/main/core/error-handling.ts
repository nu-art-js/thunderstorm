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

import {Module} from './module';
import {Dispatcher} from './dispatcher';
import {CustomException} from './exceptions';

export enum ServerErrorSeverity {
	Debug = 'Debug',
	Info = 'Info',
	Warning = 'Warning',
	Error = 'Error',
	Critical = 'Critical',
}

export const ServerErrorSeverity_Ordinal = [
	ServerErrorSeverity.Debug,
	ServerErrorSeverity.Info,
	ServerErrorSeverity.Warning,
	ServerErrorSeverity.Error,
	ServerErrorSeverity.Critical
];

export type ErrorMessage = {
	message: string,
	innerMessages?: string[]
}

export interface OnApplicationNotification {
	__processApplicationNotification(errorLevel: ServerErrorSeverity, module: Module, message: ErrorMessage): Promise<void>;
}

export const dispatch_onApplicationNotification = new Dispatcher<OnApplicationNotification, '__processApplicationNotification'>('__processApplicationNotification');

export interface OnApplicationException {
	__processApplicationException(e: CustomException, module: Module, data: any): Promise<void>;
}

export const dispatch_onApplicationException = new Dispatcher<OnApplicationException, '__processApplicationException'>('__processApplicationException');
