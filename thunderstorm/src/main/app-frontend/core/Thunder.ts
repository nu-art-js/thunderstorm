/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from "react";
import {
	renderApp,
	WrapperProps
} from "./AppWrapper";
import {
	BeLogged,
	LogClient_Browser,
	Module
} from "@nu-art/ts-common";
import {XhrHttpModule} from "../modules/http/XhrHttpModule";
import {ToastModule} from "../modules/toaster/ToasterModule";
import {RoutingModule} from "../modules/routing/RoutingModule";
import {BrowserHistoryModule} from "../modules/HistoryModule";
import {StorageModule} from "../modules/StorageModule";
import {ResourcesModule} from "../modules/ResourcesModule";
import {
	RequestErrorHandler,
	RequestSuccessHandler
} from "../../shared/request-types";
import {
	AbstractThunder,
	dispatch_requestCompleted
} from "./AbstractThunder";

export const ErrorHandler_Toast: RequestErrorHandler<any> = (request, resError?) => {
	const errorMessage = request.errorMessage || resError?.debugMessage;
	return errorMessage && ToastModule.toastError(errorMessage);
};
export const SuccessHandler_Toast: RequestSuccessHandler = (request) => request.successMessage && ToastModule.toastSuccess(request.successMessage);

export const ErrorHandler_Dispatch: RequestErrorHandler<any> = (request) => dispatch_requestCompleted.dispatchUI([request.key, false, request.requestData]);
export const SuccessHandler_Dispatch: RequestSuccessHandler = (request) => dispatch_requestCompleted.dispatchUI([request.key, true, request.requestData]);

const modules: Module[] = [
	XhrHttpModule,

	RoutingModule,
	BrowserHistoryModule,

	StorageModule,
	ResourcesModule
];

export class Thunder
	extends AbstractThunder {

	private mainApp!: React.ElementType<WrapperProps>;

	constructor() {
		super();
		this.addModules(...modules);
	}

	static getInstance(): Thunder {
		return Thunder.instance as Thunder;
	}

	init() {
		BeLogged.addClient(LogClient_Browser);

		super.init();
		// @ts-ignore
		XhrHttpModule.setErrorHandlers([ErrorHandler_Toast, ErrorHandler_Dispatch]);
		XhrHttpModule.setSuccessHandlers([SuccessHandler_Toast, SuccessHandler_Dispatch]);

		return this;
	}

	protected renderApp = (): void => {
		renderApp();
	};

	public setMainApp(mainApp: React.ElementType<WrapperProps>): Thunder {
		this.mainApp = mainApp;
		return this;
	}

	public getMainApp(): React.ElementType<WrapperProps> {
		return this.mainApp;
	}
}

