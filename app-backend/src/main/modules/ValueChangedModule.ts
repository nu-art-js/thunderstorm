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
import {FirebaseFunctionModule,} from "@nu-art/server/FirebaseFunctions";

export class NodeChangedModule_Class
	extends FirebaseFunctionModule<any> {

	constructor() {
		super(`test/{param}/changes/value`);
		this.onFunctionReady = this.onFunctionReady.bind(this);
	}

	async processChanges(previousValue: any, newValue: any, params: { [p: string]: any }): Promise<any> {
		this.logInfo(`Doing nothing...`);
	}
}

export const ValueChangedModule = new NodeChangedModule_Class();

