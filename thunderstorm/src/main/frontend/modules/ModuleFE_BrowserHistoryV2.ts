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

/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Module, Primitive,} from '@nu-art/ts-common';
import {createBrowserHistory, History, LocationDescriptorObject} from 'history';


type RecursiveObjectArray = { [key: string]: Primitive | RecursiveObjectArray | RecursiveArray; };

type RecursiveArray = (Primitive | RecursiveObjectArray | RecursiveArray)[]

// type AdvancedQueryParam = RecursiveObjectArray

// move all the shit from here to the Routing module
export class ModuleFE_BrowserHistoryV2_Class
	extends Module {
	private readonly history: History<any>;

	constructor() {
		super();
		this.history = createBrowserHistory();
	}

	/**
	 * Update and navigate according to query params
	 */
	push(push: LocationDescriptorObject) {
		this.history.push(push);
	}

	/**
	 * Update query params
	 */
	replace(push: LocationDescriptorObject) {
		this.history.replace(push);
	}

	// private composeQuery(queryParams: AdvancedQueryParam) {
	// 	const queryAsString = composeQueryParams(queryParams);
	// 	if (queryAsString.length === 0)
	// 		return undefined;
	//
	// 	return queryAsString;
	// }

}

export const ModuleFE_BrowserHistoryV2 = new ModuleFE_BrowserHistoryV2_Class();