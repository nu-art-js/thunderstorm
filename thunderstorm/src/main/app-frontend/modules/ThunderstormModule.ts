import {Module} from "@nu-art/ts-common";

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
		this.setDefaultConfig({appName: "Thunderstorm-WebApp"});
	}

	init() {
		this.setAppName(this.config.appName);
		this.setChromeThemeColor(this.config.themeColor);
	}

	setAppName(appName: string) {
		document.title = appName
	}

	setChromeThemeColor(themeColor: string) {
		let themeTag: HTMLMetaElement | null = document.head.querySelector('meta[name="theme-color"]');
		if (!themeTag) {
			themeTag = document.createElement('meta');
			themeTag.name = "theme-color";
			document.getElementsByTagName('head')[0].appendChild(themeTag);
		}

		themeTag.setAttribute('content', themeColor);
	}

	getAppName() {
		return this.config.appName;
	}

	downloadFile(props: FileDownloadProps) {
		if (!document)
			return;

		const element = document.createElement('a');
		let content: string;
		if (typeof props.content === "string")
			content = encodeURIComponent(props.content);
		else
			content = URL.createObjectURL(props.content);

		element.setAttribute('href', `data:${props.mimeType || "text/text"};charset=${props.charset || "utf-8"},${content}`);
		element.setAttribute('download', `${props.fileName}`);
		element.click();
	}
}

export const ThunderstormModule = new ThunderstormModule_Class();