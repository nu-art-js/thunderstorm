import {Module} from "@nu-art/ts-common";

type Config = {
	appName: string
}

class ThunderstormModule_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({appName: "Thunderstorm-WebApp"});
	}

	init() {
		document.title = this.config.appName;
	}

	getAppName() {
		return this.config.appName;
	}
}

export const ThunderstormModule = new ThunderstormModule_Class();