export const config = {
	HttpModule: {
		origin: "https://my-staging-project/backend",
		// origin: "https://us-central1-adam-testing-1b8aa.cloudfunctions.net",
		timeout: 10000
	},
	frontend: {
		origin: "https://my-staging-project",
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
