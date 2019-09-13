/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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

// tslint:disable-next-line:no-import-side-effect
import 'module-alias/register'
import {HttpServer} from "@nu-art/storm/server";
import {Environment} from "./config";
import {
	Firebase_ExpressFunction,
	fireStarter
} from "@nu-art/storm/firebase-functions";
import {start} from "./main";
import {ValueChangedModule} from "@modules/ValueChangedModule";

const _api = new Firebase_ExpressFunction(HttpServer.express);
export const api = _api.getFunction();

export async function loadFromFunction(environment: { name: string }) {
	const configAsObject = await fireStarter(environment);
	return start(configAsObject);
}

export const valueMonitor = ValueChangedModule.getFirebaseFunction();

loadFromFunction(Environment)
	.then(() => {
		return Promise.all([
			                   _api.onFunctionReady(),
			                   ValueChangedModule.onFunctionReady()
		                   ]);
	})
	.catch(reason => console.error("Failed to start backend: ", reason));


