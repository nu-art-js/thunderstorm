export const config = {
	HttpModule: {
		origin: "https://typescript-boilerplate.firebaseapp.com/backend/api",
		timeout: 10000
	},
	frontend: {
		origin: "https://typescript-boilerplate.firebaseapp.com",
	},
	ExampleModule: {
		remoteUrl: "/v1/sample/endpoint-example"
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
