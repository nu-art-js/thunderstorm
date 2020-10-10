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
import {
	ApiWithQuery,
	HttpMethod,
	TS_Progress
} from "../../../index";

import {Module} from "@nu-art/ts-common";
// noinspection TypeScriptPreferShortImport
import {HttpModule} from "../http/HttpModule";
import {BrowserHistoryModule} from "../HistoryModule";

type ScriptLoaderBinder = ApiWithQuery<string, string, {}, any>

export class PageLoadingModule_Class
	extends Module<{}> {

	private readonly injected: { [src: string]: HTMLScriptElement } = {};

	loadScript(src: string, progressListener: (progress: number) => void) {
		HttpModule
			.createRequest<ScriptLoaderBinder>(HttpMethod.GET, src)
			.setUrl(`${BrowserHistoryModule.getOrigin()}/${src}`)
			.setOnProgressListener((ev: TS_Progress) => {
				const progress = ev.loaded / ev.total;
				progressListener(progress);
			})
			.execute(response => {
				const divElement: HTMLScriptElement = document.createElement("script");
				divElement.innerHTML = response;
				divElement.id = src;
				divElement.async = true;
				this.injected[src] = divElement;
			});
	}

	getNode(src: string) {
		return this.injected[src];
	}
}

export const EntryComponentLoadingModule = new PageLoadingModule_Class();
