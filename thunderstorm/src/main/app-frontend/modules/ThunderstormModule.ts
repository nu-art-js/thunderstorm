import {Module} from "@intuitionrobotics/ts-common";

type Config = {
	appName: string
	themeColor: string
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
}

export const ThunderstormModule = new ThunderstormModule_Class();