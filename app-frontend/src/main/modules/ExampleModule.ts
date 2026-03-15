/*
 * A typescript & react boilerplate with api call example
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

import {__stringify, Module, Second} from '@nu-art/ts-common';

import {apiWithBody, apiWithQuery, ModuleFE_Toaster, ThunderDispatcher, ModuleFE_XHR} from '@nu-art/thunderstorm-frontend/index';
import {ApiStruct_Examples, CommonBodyReq, CustomError1, CustomError2, TestDispatch} from '@app/app-shared';
import {ApiDef, ApiDefCaller, ApiErrorResponse, HttpMethod, QueryApi} from '@nu-art/thunderstorm-shared';
import {Test} from '@modules/TestModule';
import {OnPushMessageReceived} from '@nu-art/push-pub-sub-frontend/index';
import {ModuleFE_Firebase} from '@nu-art/firebase-frontend/index';
import {DB_Notifications} from '@nu-art/push-pub-sub-shared';
import {ApiDef_Examples} from '@app/app-shared/shared/index';


type Config = {
	remoteUrl: string
}

export const RequestKey_CustomError = 'CustomError';
export const RequestKey_PostApi = 'PostApi';
export const RequestKey_GetApi = 'GetApi';
export const RequestKey_TestPush = 'TestPush';
export const RequestKey_TestApi = 'TestApi';
export const exampleDispatcher = new ThunderDispatcher<TestDispatch, 'testDispatch'>('testDispatch');

export const dispatchAll = () => {
	exampleDispatcher.dispatchUI();
	exampleDispatcher.dispatchModule();
};

// const mySubscriptions: BaseSubscriptionData[] = [{
// 	topic: 'key',
// 	props: {a: 'prop'}
// }, {
// 	topic: 'test',
// 	props: {id: 'test1'}
// }];


export class ExampleModule_Class
	extends Module<Config>
	implements OnPushMessageReceived {
	readonly getMax: ApiDefCaller<ApiStruct_Examples>['getMax'];
	readonly setMax: ApiDefCaller<ApiStruct_Examples>['setMax'];
	readonly anotherEndpoint: ApiDefCaller<ApiStruct_Examples>['anotherEndpoint'];
	readonly customError: ApiDefCaller<ApiStruct_Examples>['customError'];
	readonly dispatchEndpoint: ApiDefCaller<ApiStruct_Examples>['dispatchEndpoint'];
	readonly endpoint: ApiDefCaller<ApiStruct_Examples>['endpoint'];
	readonly testPush: ApiDefCaller<ApiStruct_Examples>['testPush'];
	readonly getWithoutParam: ApiDefCaller<ApiStruct_Examples>['getWithoutParam'];
	readonly getWithParams: ApiDefCaller<ApiStruct_Examples>['getWithParams'];
	readonly postWithoutResponse: ApiDefCaller<ApiStruct_Examples>['postWithoutResponse'];
	readonly postWithResponse: ApiDefCaller<ApiStruct_Examples>['postWithResponse'];
	private message!: string;

	data: string[] = [];
	api_data: string = 'hi my name is';
	private max: number = 0;

	constructor() {
		super();
		this.getMax = apiWithQuery(ApiDef_Examples.getMax);
		this.setMax = apiWithBody(ApiDef_Examples.setMax);
		this.anotherEndpoint = apiWithBody(ApiDef_Examples.anotherEndpoint);
		this.customError = apiWithBody(ApiDef_Examples.customError);
		this.dispatchEndpoint = apiWithQuery(ApiDef_Examples.dispatchEndpoint);
		this.endpoint = apiWithQuery(ApiDef_Examples.endpoint);
		this.testPush = apiWithQuery(ApiDef_Examples.testPush);
		this.getWithoutParam = apiWithQuery(ApiDef_Examples.getWithoutParam);
		this.getWithParams = apiWithQuery(ApiDef_Examples.getWithParams);
		this.postWithoutResponse = apiWithBody(ApiDef_Examples.postWithoutResponse);
		this.postWithResponse = apiWithBody(ApiDef_Examples.postWithResponse);
	}

	protected init(): void {
		// ModuleFE_PushPubSub.v1.registerAll(mySubscriptions).execute();
		this.runAsync('Async start', this.initAnalytics);
	}

	initAnalytics = async () => {
		const localSession = await ModuleFE_Firebase.createSession();
		const analytics = localSession.getAnalytics();
		analytics.setCurrentScreen('Example Screen');
	};

	__onMessageReceived(notification: DB_Notifications) {
		const message = `You got data! topic: ${notification.topic}, props: ${__stringify(notification.props)} with data: ${__stringify(notification.data)}`;
		// ModuleFE_Toaster.toastSuccess(message);
		this.logInfo('payload received in module', message, notification);
	}

	callCustomErrorApi() {
		this.customError().execute(undefined, (request, resError?: ApiErrorResponse<CustomError1 | CustomError2>) => {
			const error = resError?.error;
			if (!error)
				return;

			const errorType = error.type;
			if (!errorType)
				return;

			let errorBody: CustomError1 | CustomError2 | undefined;
			switch (errorType) {
				case 'CustomError1':
					errorBody = error.body as CustomError1;
					ModuleFE_Toaster.toastError(`${errorBody.prop1}\n${errorBody.prop2}`);
					break;

				case 'CustomError2':
					errorBody = error.body as CustomError2;
					ModuleFE_Toaster.toastError(`${errorBody.prop3}\n${errorBody.prop4}`);
					break;
			}
		});
	}

	public getMessageFromServer1 = () => {
		this.logInfo('getting label from server');
		const bodyObject: CommonBodyReq = {message: this.message || 'No message'};
		this.anotherEndpoint(bodyObject).execute(this.setMessage);
		this.logInfo('continue... will receive an event once request is completed..');
	};

	public getMessageFromServer2 = () => {
		this.logInfo('getting label from server');
		type DynamicApiStructExample = QueryApi<any, {}, void>;
		const dynamicApiExample: ApiDef<DynamicApiStructExample> = {method: HttpMethod.GET, path: this.config.remoteUrl};
		const r = ModuleFE_XHR
			.createRequest(dynamicApiExample, RequestKey_GetApi)
			.setRelativeUrl(this.config.remoteUrl);

		r.execute(this.setMessage);

		this.logInfo('continue... will receive an event once request is completed..');
	};

	testPush = () => {
		this.logInfo('getting label from server');
		this.testPush({}).execute();
	};

	setMessage = async (_message: unknown) => {
		const message = _message as string;
		this.logInfo(`got message: ${message}`);
		this.message = message;
	};

	getMessage = () => this.message;

	getData = () => this.data;

	setData = () => {
		this.data = ['hey ', 'there!'];
	};

	getApiData = () => this.api_data;

	testClickHandler = () => {
		console.log('testing...');
		setTimeout(() => {
			this.setData();
			dispatchAll();
		}, 2 * Second);
	};

	testModDispatcher = () => {
		console.log('testing the mod dispatcher');
		setTimeout(() => {
			Test.setModData();
		}, 2 * Second);
	};

	testBackendDispatcher = () => {
		this.logInfo('passing to server');
		this.dispatchEndpoint({}).execute(async (response) => {
			this.fetchMax();
			console.log('i think i got something...');
			console.log(response);
			this.api_data = response as string;
			dispatchAll();
		});
		this.logInfo('continue... will receive an event once request is completed..');
	};

	fetchMax = () => {
		this.getMax({}).execute(async response => {
			this.max = (response as { n: number }).n;
			dispatchAll();
		});
	};

	getMax = () => this.max;
}

export const ExampleModule = new ExampleModule_Class();
