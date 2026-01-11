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

import {_keys, BadImplementationException, Module, MUSTNeverHappenException, Promise_all_sequentially, RuntimeModules, TypedMap} from '@nu-art/ts-common';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster.js';
import {composeURL} from './routing/ModuleFE_RoutingV2.js';
import {GenericUpdate, HttpMethod, QueryApi, UrlQueryParams} from '@nu-art/thunderstorm-shared';
import {base64ToBlob} from '../utils/tools.js';
import {ModuleFE_XHR} from '../../../../../http-infra/frontend/src/main/ModuleFE_XHR.js';
import {dispatch_onClearWebsiteData} from './clearWebsiteDataDispatcher.js';
import {ModuleFE_BaseApi} from './db-api-gen/ModuleFE_BaseApi.js';

type Config = {
	appName: string
	themeColor: string
}

export type UrlTarget = '_blank' | '_self' | '_parent' | '_top' | string;


export type FileDownloadProps = {
	url?: string, //if want to download from url
	content?: Blob | string //file to download
	fileName: string //name to save file in
	mimeType?: string
	charset?: string
}

class ModuleFE_Thunderstorm_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({appName: 'Thunderstorm-WebApp'});
	}

	init() {
		this.setAppName(this.config.appName);
		this.setChromeThemeColor(this.config.themeColor);
	}

	setAppName(appName: string) {
		document.title = appName;
	}

	setChromeThemeColor(themeColor: string) {
		let themeTag: HTMLMetaElement | null = document.head.querySelector('meta[name="theme-color"]');
		if (!themeTag) {
			themeTag = document.createElement('meta');
			themeTag.name = 'theme-color';
			document.getElementsByTagName('head')[0].appendChild(themeTag);
		}

		themeTag.setAttribute('content', themeColor);
	}

	async clearWebsiteData() {
		this.logInfo('Cleaning IDB called.');
		return await dispatch_onClearWebsiteData.dispatchModuleAsync();
	}

	async copyToClipboard(toCopy: string, customSuccessMessage?: string) {
		try {
			await navigator.clipboard.writeText(toCopy);
			ModuleFE_Toaster.toastInfo(customSuccessMessage ?? `Copied to Clipboard:\n"${toCopy}"`);
		} catch (e) {
			ModuleFE_Toaster.toastError(`Failed to copy to Clipboard:\n"${toCopy}"`);
		}
	}

	async readFileContent(file: File) {
		const fullUrl = URL.createObjectURL(file);
		const content = ModuleFE_XHR.createRequest<QueryApi<string>>({method: HttpMethod.GET, fullUrl, path: ''}).executeSync();
		URL.revokeObjectURL(fullUrl);
		return content;
	}

	async writeToClipboard(imageAsBase64: string, contentType = 'image/png') {
		try {
			// const clipboardItem = new ClipboardItem({'image/png': imageAsBase64});
			const clipboardItem = new ClipboardItem({contentType: await base64ToBlob(imageAsBase64)});
			await navigator.clipboard.write([clipboardItem]);

			// TODO: Render Blob in toast
			ModuleFE_Toaster.toastInfo(`Copied image Clipboard`);
		} catch (error) {
			ModuleFE_Toaster.toastError(`Failed to copy image to Clipboard`);
		}
	}

	getAppName() {
		return this.config.appName;
	}

	openUrl(url: string | { url: string, params?: TypedMap<(() => string) | string | undefined> }, target?: UrlTarget) {
		if (!window)
			throw new BadImplementationException('no window in vm context');

		let urlObj = url;

		if (typeof urlObj === 'string')
			urlObj = {url: urlObj};

		const params = urlObj.params || {};
		const calculatedParams = _keys(params || {}).reduce((toRet, key) => {
			const param = params[key];
			if (typeof param === 'function') {
				const value = param?.();
				if (value)
					toRet[key] = value;
			} else
				toRet[key] = param;

			return toRet;
		}, {} as UrlQueryParams);

		window.open(composeURL(urlObj.url, calculatedParams), target || '_self');
	}

	downloadFile(props: FileDownloadProps) {
		if (!document)
			return;

		const element = document.createElement('a');
		if (props.content) {
			let content: string;
			if (typeof props.content === 'string')
				content = encodeURIComponent(props.content);
			else
				content = URL.createObjectURL(props.content);
			element.setAttribute('href', `data:${props.mimeType || 'text/text'};charset=${props.charset || 'utf-8'},${content}`);
		} else {
			element.setAttribute('href', props.url as string);
		}

		element.setAttribute('download', `${props.fileName}`);
		element.click();
	}

	performGenericUpdate = async (updateData: GenericUpdate[]) => {
		const promises: (() => Promise<void>)[] = [];
		updateData.forEach(update => {
			const module = RuntimeModules().find<ModuleFE_BaseApi<any>>(module => module.dbDef?.dbKey === update.dbKey);
			if (!module)
				throw new MUSTNeverHappenException(`Trying to perform a generic update without an existing module for dbKey ${update.dbKey}`);

			if (update.data.toUpdate?.length)
				promises.push(() => module.onEntriesUpdated(update.data.toUpdate!));

			if (update.data.toDelete?.length)
				promises.push(() => module.onEntriesDeleted(update.data.toDelete!));
		});
		await Promise_all_sequentially(promises);
	};
}

export const ModuleFE_Thunderstorm = new ModuleFE_Thunderstorm_Class();