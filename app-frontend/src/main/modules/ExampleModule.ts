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

import {ThunderDispatcher, ToastModule, XhrHttpModule} from '@nu-art/thunderstorm/frontend';
import {
	CommonBodyReq,
	CustomError1,
	CustomError2,
	ExampleApiCustomError,
	ExampleApiGetType,
	ExampleApiPostType,
	ExampleApiTest,
	ExampleGetMax,
	ExampleTestPush,
	TestDispatch
} from '@app/app-shared';
import {ErrorResponse, HttpMethod} from '@nu-art/thunderstorm';
import {Test} from '@modules/TestModule';
import {NotificationsModule, OnNotificationsUpdated, OnPushMessageReceived, ModuleBE_PushPubSub} from '@nu-art/push-pub-sub/frontend';
import {FirebaseModule} from '@nu-art/firebase/frontend';
import {BaseSubscriptionData, DB_Notifications} from '@nu-art/push-pub-sub';


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

const mySubscriptions: BaseSubscriptionData[] = [{
	pushKey: 'key',
	props: {a: 'prop'}
}, {
	pushKey: 'test',
	props: {id: 'test1'}
}];

export class ExampleModule_Class
	extends Module<Config>
	implements OnPushMessageReceived, OnNotificationsUpdated {

	private message!: string;

	data: string[] = [];
	api_data: string = 'hi my name is';
	private max: number = 0;

	protected init(): void {
		ModuleBE_PushPubSub.subscribeMulti(mySubscriptions);
		this.runAsync('Async start', this.initAnalytics);
	}

	initAnalytics = async () => {
		const localSession = await FirebaseModule.createSession();
		const analytics = localSession.getAnalytics();
		analytics.setCurrentScreen('Example Screen');
	};

	__onMessageReceived(notification: DB_Notifications) {
		const message = `You got data! pushKey: ${notification.pushKey}, props: ${__stringify(notification.props)} with data: ${__stringify(notification.data)}`;
		// ToastModule.toastSuccess(message);
		this.logInfo('payload received in module', message, notification);
	}

	__onNotificationsUpdated(): void {
		this.logInfo('these are the notifications you actually care about:', NotificationsModule.getNotifications());
	}

	callCustomErrorApi() {
		XhrHttpModule
			.createRequest<ExampleApiCustomError>(HttpMethod.POST, RequestKey_CustomError)
			.setRelativeUrl('/v1/sample/custom-error')
			.setOnError((request, resError?: ErrorResponse<CustomError1 | CustomError2>) => {
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
						ToastModule.toastError(`${errorBody.prop1}\n${errorBody.prop2}`);
						break;

					case 'CustomError2':
						errorBody = error.body as CustomError2;
						ToastModule.toastError(`${errorBody.prop3}\n${errorBody.prop4}`);
						break;
				}
			})
			.setOnSuccessMessage(`Success`)
			.execute();

	}

	public getMessageFromServer1 = () => {
		this.logInfo('getting label from server');
		const bodyObject: CommonBodyReq = {message: this.message || 'No message'};

		const r = XhrHttpModule
			.createRequest<ExampleApiPostType>(HttpMethod.POST, RequestKey_PostApi)
			.setBodyAsJson(bodyObject)
			.setRelativeUrl('/v1/sample/another-endpoint')
			.setOnError(`Error getting new message from backend`);

		r.execute(this.setMessage);

		this.logInfo('continue... will receive an event once request is completed..');
	};

	public getMessageFromServer2 = () => {
		this.logInfo('getting label from server');

		const r = XhrHttpModule
			.createRequest<ExampleApiGetType>(HttpMethod.GET, RequestKey_GetApi)
			.setRelativeUrl(this.config.remoteUrl)
			.setOnError(`Error getting new message from backend`);

		r.execute(this.setMessage);

		this.logInfo('continue... will receive an event once request is completed..');
	};

	testPush = () => {
		this.logInfo('getting label from server');

		XhrHttpModule
			.createRequest<ExampleTestPush>(HttpMethod.GET, RequestKey_TestPush)
			.setRelativeUrl('/v1/sample/push-test')
			.setOnError(`Error testing push message pub sub`)
			.execute();
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
		XhrHttpModule
			.createRequest<ExampleApiTest>(HttpMethod.GET, RequestKey_TestApi)
			.setRelativeUrl('/v1/sample/dispatch-endpoint')
			.setOnError(`Error getting a message from backend`)
			.execute(async response => {
				this.fetchMax();
				console.log('i think i got something...');
				console.log(response);
				this.api_data = response as string;
				dispatchAll();
			});

		this.logInfo('continue... will receive an event once request is completed..');
	};

	fetchMax = () => {
		const r = XhrHttpModule
			.createRequest<ExampleGetMax>(HttpMethod.GET, RequestKey_TestApi)
			.setRelativeUrl('/v1/sample/get-max')
			.setOnError(`Error getting max from backend`);

		r.execute(async response => {
			this.max = (response as { n: number }).n;
			dispatchAll();
		});
	};

	getMax = () => this.max;
}

export const ExampleModule = new ExampleModule_Class();
