/*
 * Testelot is a typescript scenario composing framework
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	BeLogged,
	LogLevel
} from "@ir/ts-common";

import {
	Action_Custom,
	Action_Http,
	Action_Log,
	Action_Sleep,
	Action_ThrowException,
	ContextKey,
	HttpMethod,
	Scenario,
	TestException,
} from "../index";

import {Reporter} from "./Reporter";
import * as objectHash from "object-hash";

export function __log(logMessage: string, level: LogLevel = LogLevel.Verbose): Action_Log {
	// @ts-ignore
	return new Action_Log(logMessage, level);
}

export function __sleep(sleepMs: number): Action_Sleep {
	// @ts-ignore
	return new Action_Sleep(sleepMs);
}

export function __http<T extends object = any>(method: HttpMethod): Action_Http {
	// @ts-ignore
	return new Action_Http<T>(method);
}

export function __custom<P extends any = any, R extends any = any>(action: (action: Action_Custom, param?: P) => Promise<R>): Action_Custom {
	// @ts-ignore
	return new Action_Custom<P, R>(action);
}

export function __compareKeys<P extends any = any>(key1: ContextKey<P>, key2: ContextKey<P>): Action_Custom {
	return __custom<P, void>(async (action: Action_Custom) => {
		if (objectHash(action.get(key1)) !== objectHash(action.get(key2)))
			throw new TestException(`NON matched values for keys '${key1.key}' !== '${key2.key}'`);
	});
}

export function __scenario(label: string | (() => string), reporter?: Reporter): Scenario {
	// @ts-ignore
	const scenario = new Scenario();
	scenario.setLabel(label);
	if (reporter) {
		scenario.setReporter(reporter);
	}

	return scenario;
}

export function __throwException(message: string): Action_ThrowException {
	// @ts-ignore
	return new Action_ThrowException(message);
}

export function enableTerminalLogReWrite() {
	BeLogged.rewriteConsole = (lineCount => {
		let rewriteCommand = "";
		for (let i = 0; i < lineCount; i++) {
			rewriteCommand += "tput cuu1 tput el;"
		}

		try {
			require("child_process").execSync(rewriteCommand, {stdio: 'inherit'});
		} catch (e) {
		}
	});
}


export function _executeScenario(scenario: Scenario) {
	new Promise(scenario.run)
		.then(() => {
			scenario.logInfo("-------------- COMPLETED -----------------");
		})
		.catch(reason => {
			scenario.logError("---------------- ERROR -----------------");
			scenario.logError(reason);
		});

}