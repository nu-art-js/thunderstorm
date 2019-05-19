export const config = {
	HttpModule: {
		origin: "http://typescript-boilerplate.firebaseapp.com/backend/api",
		timeout: 10000
	},
	frontend: {
		origin: "http://typescript-boilerplate.firebaseapp.com",
	},
	Module_Example: {
		remoteUrl: "/api/v1/sample/endpoint-example"
	},
	LocalizationModule: {
		defaultLocale: "en",
		locales: {
			"en": {
				label: "Language_English",
				icon: "languages/en",
			},
			"nl": {
				label: "Language_Dutch",
				icon: "languages/nl"
			}
		},
		languages: {
			"en": require(`./res/localization/en`),
			"nl": require(`./res/localization/nl`),
		}
	}
};
