/*
 * Thunderstorm is a full web app framework!
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
	_keys,
	BadImplementationException,
	composeUrl,
	Module,
	MUSTNeverHappenException,
	Promise_all_sequentially,
	RuntimeModules,
	TypedMap
} from '@nu-art/ts-common';
import {ModuleFE_Toaster} from '@nu-art/thunder-widgets';
import {base64ToBlob, dispatch_onClearWebsiteData} from '@nu-art/thunder-core';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';

type Config = {
	appName: string;
	themeColor: string;
};

export type UrlTarget = '_blank' | '_self' | '_parent' | '_top' | string;

export type FileDownloadProps = {
	url?: string;
	content?: Blob | string;
	fileName: string;
	mimeType?: string;
	charset?: string;
};

export type GenericUpdate = {
	dbKey: string;
	data: Partial<{ toUpdate: unknown[]; toDelete: unknown[] }>;
};

type UrlQueryParams = Record<string, string | undefined>;

class ModuleFE_Thunderstorm_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({appName: 'Thunderstorm-WebApp', themeColor: ''});
	}

	init() {
		this.setAppName(this.config.appName);
		if (this.config.themeColor)
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
		} catch {
			ModuleFE_Toaster.toastError(`Failed to copy to Clipboard:\n"${toCopy}"`);
		}
	}

	async readFileContent(file: File): Promise<string> {
		const fullUrl = URL.createObjectURL(file);
		try {
			const res = await fetch(fullUrl);
			return await res.text();
		} finally {
			URL.revokeObjectURL(fullUrl);
		}
	}

	async writeToClipboard(imageAsBase64: string, contentType = 'image/png') {
		try {
			const blob = await base64ToBlob(imageAsBase64);
			const clipboardItem = new ClipboardItem({[contentType]: blob});
			await navigator.clipboard.write([clipboardItem]);
			ModuleFE_Toaster.toastInfo('Copied image Clipboard');
		} catch {
			ModuleFE_Toaster.toastError('Failed to copy image to Clipboard');
		}
	}

	getAppName() {
		return this.config.appName;
	}

	openUrl(
		url: string | { url: string; params?: TypedMap<(() => string) | string | undefined> },
		target?: UrlTarget
	) {
		if (!window)
			throw new BadImplementationException('no window in vm context');

		let urlObj: { url: string; params?: TypedMap<(() => string) | string | undefined> };
		if (typeof url === 'string')
			urlObj = {url};
		else
			urlObj = url;

		const params = urlObj.params ?? {};
		const calculatedParams: UrlQueryParams = _keys(params).reduce((toRet, key) => {
			const param = params[key];
			if (typeof param === 'function') {
				const value = param?.();
				if (value !== undefined && value !== '')
					toRet[key] = String(value);
			} else if (param !== undefined)
				toRet[key] = param;

			return toRet;
		}, {} as UrlQueryParams);

		window.open(composeUrl(urlObj.url, calculatedParams), target ?? '_self');
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
			element.setAttribute('href', `data:${props.mimeType ?? 'text/text'};charset=${props.charset ?? 'utf-8'},${content}`);
		} else {
			element.setAttribute('href', props.url as string);
		}
		element.setAttribute('download', `${props.fileName}`);
		element.click();
	}

	performGenericUpdate = async (updateData: GenericUpdate[]) => {
		const promises: (() => Promise<void>)[] = [];
		for (const update of updateData) {
			const module = RuntimeModules().find((m): m is ModuleFE_BaseApi<any> =>
				m instanceof ModuleFE_BaseApi && (m as ModuleFE_BaseApi<any>).config?.dbKey === update.dbKey
			);
			if (!module)
				throw new MUSTNeverHappenException(`Trying to perform a generic update without an existing module for dbKey ${update.dbKey}`);

			const data = update.data;
			const api = module as ModuleFE_BaseApi<any>;
			if (data.toUpdate?.length)
				promises.push(() => api.onEntriesUpdated(data.toUpdate!));
			if (data.toDelete?.length)
				promises.push(() => api.onEntriesDeleted(data.toDelete!));
		}
		await Promise_all_sequentially(promises);
	};
}

export const ModuleFE_Thunderstorm = new ModuleFE_Thunderstorm_Class();
