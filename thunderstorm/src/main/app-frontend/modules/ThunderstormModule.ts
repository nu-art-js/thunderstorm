import {Module} from '@nu-art/ts-common';

type Config = {
	appName: string
	themeColor: string
}

type FileDownloadProps = {
	content: Blob | string
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
		setTimeout(() => printingContentWindow.print(), 1500);
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

	getAppName() {
		return this.config.appName;
	}

	openNewTab(url: string, newTab = false) {
		if (window)
			window.open(url, newTab ? '' : '_blank');
	}

	downloadFile(props: FileDownloadProps) {
		if (!document)
			return;

		const element = document.createElement('a');
		let content: string;
		if (typeof props.content === 'string')
			content = encodeURIComponent(props.content);
		else
			content = URL.createObjectURL(props.content);

		element.setAttribute('href', `data:${props.mimeType || 'text/text'};charset=${props.charset || 'utf-8'},${content}`);
		element.setAttribute('download', `${props.fileName}`);
		element.click();
	}
}

export const ThunderstormModule = new ThunderstormModule_Class();