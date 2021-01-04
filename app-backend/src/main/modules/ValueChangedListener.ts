/*
 * A backend boilerplate with example apis
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
import {FirebaseFunctionModule,} from "@ir/firebase/backend-functions";
import {PushPubSubModule} from "@ir/push-pub-sub/backend";

export class ValueChangedListener_Class
	extends FirebaseFunctionModule {

	constructor() {
		super(`test/{param}/changes/value`);
		this.getFunction = this.getFunction.bind(this);
		this.onFunctionReady = this.onFunctionReady.bind(this);
	}

	processChanges = async (previousValue: any, newValue: any, params: { [p: string]: any }): Promise<any> => {
		this.logInfo(`Doing nothing...`);
		await PushPubSubModule.pushToKey('test', {id: 'test1'}, {a: 'b', b: 1});
	};
}

export const ValueChangedListener = new ValueChangedListener_Class();

