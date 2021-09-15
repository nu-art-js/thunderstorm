import {
	BadImplementationException,
	Module
} from "@nu-art/ts-common";
import {initializeApp} from "firebase/app";
import {getMessaging} from "firebase/messaging/sw";
import {
	FirebaseApp,
	FirebaseOptions
} from "@firebase/app";

type Config = {
	[s: string]: FirebaseOptions;
}

const localSessionId = "local";

class FirebaseModule_Class
	extends Module<Config> {

	createSwSession = () => {
		const config = this.config[localSessionId];
		if (!config)
			throw new BadImplementationException("Missing local config to initiate the service worker");

		return initializeApp(config);
	};

	getMessaging = (app: FirebaseApp) => {
		return getMessaging(app);
	};

}


export const FirebaseModule = new FirebaseModule_Class();