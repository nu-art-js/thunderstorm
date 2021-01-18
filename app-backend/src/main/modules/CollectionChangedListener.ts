/*
 * A backend boilerplate with example apis
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
import {PushPubSubModule} from "@nu-art/push-pub-sub/backend";
import {FirestoreFunctionModule} from "@nu-art/firebase/backend-functions";

export class CollectionChangedListener_Class
	extends FirestoreFunctionModule<object>{

	constructor() {
		super(`test`);
		this.getFunction = this.getFunction.bind(this);
		this.onFunctionReady = this.onFunctionReady.bind(this);
	}

	processChanges = async (params: { [p: string]: any }, previousValue?: object, newValue?: object ): Promise<any> => {
		this.logInfo(`Doing nothing...${previousValue}, ${newValue}`);
		await PushPubSubModule.pushToKey('collection_test', {id: 'collection_test1'}, {a: 'b', b: 1});
	};
}

export const CollectionChangedListener = new CollectionChangedListener_Class();


