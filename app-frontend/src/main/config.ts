/**
 * Created by tacb0ss on 27/07/2018.
 */
export const config = {
	backend: {
		// origin: "http://192.168.1.5:3000",
		origin: "https://localhost:3000",
	},
	frontend: {
		// origin: "http://192.168.1.5:3010",
		origin: "https://localhost:3010",
	},
	localization: {
		defaultLanguage: "en",
		data: require(`./res/localization/en`),

		languages: {
			"en": {
				label: "Language_English",
				icon: "languages/en"
			},
			"nl": {
				label: "Language_Dutch",
				icon: "languages/nl"
			}
		}
	},
	fonts: {
		defaultFont: "sans-serif",
		fonts: [
			{
				name: "sans-serif",
			},
			{
				name: "serif",
			},
			{
				name: "fantasy",
			},
			{
				name: "cursive",
			},
			{
				name: "monospace",
			}
		]
	}
};
