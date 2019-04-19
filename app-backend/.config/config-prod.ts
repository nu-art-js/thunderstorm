export const Environment = {
	comment: "while your config-*.ts may hold sensitive data it is wise not to store it in git!!",
	isDebug: true,
	name: "staging",
	serverUrl: "https://my-prod-project",
	HttpServer: {
		cors: {
			origins: [
				"https://my-prod-project-frontend"
			],
			methods: [
				"GET",
				"POST"
			],
			headers: [
				"content-type",
				"token"
			]
		},
		host: "localhost",
		port: "3333"
	}
};