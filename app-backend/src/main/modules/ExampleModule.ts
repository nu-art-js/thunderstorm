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
import {Dispatcher, Module, randomObject} from '@nu-art/ts-common';
import {ApiDef_Examples, ApiStruct_Examples, CustomError1, CustomError2, TestDispatch} from '@app/app-shared';
import {ModuleBE_Firebase, FirestoreCollection} from '@nu-art/firebase/backend';
import {ApiDefServer, ApiException, ApiModule, assertProperty, createBodyServerApi, createQueryServerApi, QueryRequestInfo} from '@nu-art/thunderstorm/backend';
import {ModuleBE_PushPubSub} from '@nu-art/push-pub-sub/backend';

type Config = {
	options: string[],
	dispatchNum: string
}

class ExampleModule_Class
	extends Module<Config>
	implements QueryRequestInfo, ApiModule {
	dispatcher = new Dispatcher<TestDispatch, 'testDispatch'>('testDispatch');
	readonly v1: ApiDefServer<ApiStruct_Examples>['v1'];

	constructor() {
		super();
		this.v1 = {
			getMax: createQueryServerApi(ApiDef_Examples.v1.getMax, DispatchModule.getMax),
			setMax: createBodyServerApi(ApiDef_Examples.v1.setMax, (body) => {
				console.log('Setting max');
				return DispatchModule.setMax(body.n);
			}),
			anotherEndpoint: createBodyServerApi(ApiDef_Examples.v1.anotherEndpoint, (body) => {
				assertProperty(body, 'message');
				this.logInfoBold(`got id: ${body.message}`);
				return new Promise(() => 'another endpoint response');
			}),
			customError: createBodyServerApi(ApiDef_Examples.v1.customError, () => {
				const debugMessage = 'The debug message, you will only see this while your backend configuration is set to debug true';
				const error1: CustomError1 = {prop1: 'value for prop1', prop2: 'value for prop2'};
				const error2: CustomError2 = {prop3: 'value for prop3', prop4: 'value for prop4'};
				const exception1 = new ApiException<CustomError1>(422, debugMessage).setErrorBody({type: 'CustomError1', body: error1});
				const exception2 = new ApiException<CustomError2>(402, debugMessage).setErrorBody({type: 'CustomError2', body: error2});

				throw randomObject([exception1, exception2]);
			}),
			dispatchEndpoint: createQueryServerApi(ApiDef_Examples.v1.dispatchEndpoint, async () => {
				return await this.getDispatchNumber();
			}),
			endpoint: createQueryServerApi(ApiDef_Examples.v1.endpoint, async () => {
				return this.getRandomString();
			}),
			testPush: createQueryServerApi(ApiDef_Examples.v1.testPush, async () => {
				await ModuleBE_PushPubSub.pushToKey('key', {a: 'prop'}, {some: 'more', data: 'here'});
				// await ModuleBE_PushPubSub.pushToUser('9226fa2e4c128b84fd46526ca6ee926c', 'key', {a: 'prop'}, {some: 'more', data: 'here'}, true);
				return 'push succeeded!';
			}),
			getWithoutParam: createQueryServerApi(ApiDef_Examples.v1.getWithoutParam, async () => {
				return 'another endpoint response';
			}),
			getWithParams: createQueryServerApi(ApiDef_Examples.v1.getWithParams, async () => {
				return 'another endpoint response';
			}),
			postWithoutResponse: createBodyServerApi(ApiDef_Examples.v1.postWithoutResponse, async (body) => {
				assertProperty(body, 'message');

				if (!body.message)
					return;

				this.logInfoBold(`got id: ${body.message}`);
			}),
			postWithResponse: createBodyServerApi(ApiDef_Examples.v1.postWithResponse, async (body) => {
				this.logInfoBold(`got id: ${body.message}`);
				return 'needs to return a string';
			}),
		};
	}

	useRoutes() {
		return this.v1;
	}

	async __queryRequestInfo(): Promise<{ key: string; data: any }> {
		return {
			key: 'AccountsModule', data: {_id: '9226fa2e4c128b84fd46526ca6ee926c'}
		};
	}

	getRandomString() {
		return this.config.options[Math.floor(Math.random() * (this.config.options.length))];
	}

	async getDispatchNumber() {
		await this.dispatcher.dispatchModuleAsync();
		return this.config.dispatchNum;
	}
}

class DispatchModule_Class
	extends Module<Config>
	implements TestDispatch {
	private numbers!: FirestoreCollection<{ n: number }>;


	protected init(): void {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		this.numbers = firestore.getCollection<{ n: number }>('test-dispatcher', ['n']);
	}

	testDispatch = async () => {
		const max = await this.getMaxImpl();
		await this.numbers.upsert({n: max + 1});
	};

	getMax = async () => {
		const n = await this.getMaxImpl();
		return {n};
	};

	setMax = async (n: number) => {
		await this.numbers.upsert({n});
	};

	private async getMaxImpl() {
		const data = await this.numbers.getAll();
		return data.length > 0 ? Math.max(...data.map(d => d.n)) : 0;
	}
}

export const DispatchModule = new DispatchModule_Class();
export const ExampleModule = new ExampleModule_Class();
