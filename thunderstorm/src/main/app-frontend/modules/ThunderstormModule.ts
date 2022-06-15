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

import {BadImplementationException, Module} from '@nu-art/ts-common';
import {ToastModule} from '../component-modules/ToasterModule';
import {composeURL} from './HistoryModule';
import {QueryParams} from '../../shared/types';
import {base64ToBlob} from '../utils/tools';


type Config = {
	appName: string
	themeColor: string
}

export type FileDownloadProps = {
	url?: string,
	content?: Blob | string
	fileName: string
	mimeType?: string
	charset?: string
}

class ThunderstormModule_Class
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

	printDiv(div: HTMLDivElement) {
		//create, and remove iframe from body dynamically!!
		const printingIFrame = document.createElement('iframe');
		printingIFrame.style.width = '0';
		printingIFrame.style.height = '0';
		printingIFrame.style.position = 'absolute';
		const body = document.getElementsByTagName('body')[0];
		body?.appendChild(printingIFrame);

		this._populatePrintFrame(printingIFrame, div);
	}

	private _populatePrintFrame(printingIFrame: HTMLIFrameElement, div: HTMLDivElement) {
		const printingContentWindow = printingIFrame.contentWindow;
		if (!printingContentWindow)
			return this.logWarning('printingContentWindow is undefined');

		printingContentWindow.document.open();
		printingContentWindow.document.write(div.innerHTML);
		const html = printingContentWindow.document.getElementsByTagName('html')?.[0];
		const body: HTMLBodyElement | null = html.getElementsByTagName('body')?.[0];
		html.removeChild(html.getElementsByTagName('head')?.[0]);
		html?.insertBefore(window.document.getElementsByTagName('head')?.[0]?.cloneNode(true), body);
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

	async copyToClipboard(toCopy: string) {
		try {
			await navigator.clipboard.writeText(toCopy);
			ToastModule.toastInfo(`Copied to Clipboard:\n"${toCopy}"`);
		} catch (e) {
			ToastModule.toastError(`Failed to copy to Clipboard:\n"${toCopy}"`);
		}
	}

	async writeToClipboard(imageAsBase64: string, contentType = 'image/png') {
		try {
			// const clipboardItem = new ClipboardItem({'image/png': imageAsBase64});
			const clipboardItem = new ClipboardItem({contentType: await base64ToBlob(imageAsBase64)});
			await navigator.clipboard.write([clipboardItem]);

			// TODO: Render Blob in toast
			ToastModule.toastInfo(`Copied image Clipboard`);
		} catch (error) {
			ToastModule.toastError(`Failed to copy image to Clipboard`);
		}
	}

	getAppName() {
		return this.config.appName;
	}

	openNewTab(url: string | { url: string, params?: QueryParams }, newTab = false) {
		if (!window)
			throw new BadImplementationException('no window in vm context');

		if (typeof url === 'string')
			url = {url};

		window.open(composeURL(url.url, url.params), newTab ? '' : '_blank');
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

export const ThunderstormModule = new ThunderstormModule_Class();