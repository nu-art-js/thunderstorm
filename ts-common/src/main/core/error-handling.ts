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

import {Module} from "./module";
import {Dispatcher} from "./dispatcher";

export enum ServerErrorSeverity {
	Debug    = "Debug",
	Info     = "Info",
	Warning  = "Warning",
	Error    = "Error",
	Critical = "Critical",
}

export const ServerErrorSeverity_Ordinal = [
	ServerErrorSeverity.Debug,
	ServerErrorSeverity.Info,
	ServerErrorSeverity.Warning,
	ServerErrorSeverity.Error,
	ServerErrorSeverity.Critical
];

export interface OnApplicationError {
	__processApplicationError(errorLevel: ServerErrorSeverity, module: Module, message: string): Promise<void>;
}

export const dispatch_onServerError = new Dispatcher<OnApplicationError, "__processApplicationError">("__processApplicationError");
