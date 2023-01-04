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

import {BadImplementationException, Module, TypedKeyValue} from '@nu-art/ts-common';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster';
import {composeURL} from './ModuleFE_BrowserHistory';
import {HttpMethod, QueryApi, QueryParams} from '../../shared/types';
import {base64ToBlob} from '../utils/tools';
import {XhrHttpModule} from './http/XhrHttpModule';
import {dispatch_onClearWebsiteData} from './clearWebsiteDataDispatcher';


type Config = {
	appName: string
	themeColor: string
}

export type UrlTarget = '_blank' | '_self' | '_parent' | '_top' | string;

export type FileDownloadProps = {
	url?: string,
	content?: Blob | string
	fileName: string
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

	printDiv(div: HTMLDivElement, bodyAttributes?: TypedKeyValue<string, string>[]) {
		//create, and remove iframe from body dynamically!!
		const printingIFrame = document.createElement('iframe');
		printingIFrame.style.width = '0';
		printingIFrame.style.height = '0';
		printingIFrame.style.position = 'absolute';
		const body = document.getElementsByTagName('body')[0];
		body?.appendChild(printingIFrame);
		this._populatePrintFrame(printingIFrame, div, bodyAttributes);
	}

	private _populatePrintFrame(printingIFrame: HTMLIFrameElement, div: HTMLDivElement, bodyAttributes?: TypedKeyValue<string, string>[]) {
		const printingContentWindow = printingIFrame.contentWindow;
		if (!printingContentWindow)
			return this.logWarning('printingContentWindow is undefined');

		//Populate the window document
		const containerText = '<div style="display: none">printDiv function!</div>';
		printingContentWindow.document.open();
		printingContentWindow.document.write(containerText);

		//Grab essential elements
		const html = printingContentWindow.document.getElementsByTagName('html')?.[0];
		const body: HTMLBodyElement | null = html.getElementsByTagName('body')?.[0];

		//Add body attributes
		bodyAttributes?.forEach(att => {
			body.setAttribute(att.key, att.value);
		});

		//Clone and append the printed item to the body
		const toAppend = div.cloneNode(true);
		body.appendChild(toAppend);

		//Copy head content from app to the iframe (for css and metas)
		html.removeChild(html.getElementsByTagName('head')?.[0]);
		html?.insertBefore(window.document.getElementsByTagName('head')?.[0]?.cloneNode(true), body);

		//Close document for writing and call the print dialog
		printingContentWindow.document.close();
		printingContentWindow.focus();
		setTimeout(async () => printingContentWindow.print(), 1500);
		return body;
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

	async clearWebsiteData(resync: boolean = false) {
		return dispatch_onClearWebsiteData.dispatchModuleAsync(resync);
	}

	async copyToClipboard(toCopy: string) {
		try {
			await navigator.clipboard.writeText(toCopy);
			ModuleFE_Toaster.toastInfo(`Copied to Clipboard:\n"${toCopy}"`);
		} catch (e) {
			ModuleFE_Toaster.toastError(`Failed to copy to Clipboard:\n"${toCopy}"`);
		}
	}

	async readFileContent(file: File) {
		const fullUrl = URL.createObjectURL(file);
		const content = XhrHttpModule.createRequest<QueryApi<string>>({method: HttpMethod.GET, fullUrl, path: ''}).executeSync();
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

	openUrl(url: string | { url: string, params?: QueryParams }, target?: UrlTarget) {
		if (!window)
			throw new BadImplementationException('no window in vm context');

		let urlObj = url;

		if (typeof urlObj === 'string')
			urlObj = {url: urlObj};

		window.open(composeURL(urlObj.url, urlObj.params), target || '_self');
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
}

export const ModuleFE_Thunderstorm = new ModuleFE_Thunderstorm_Class();