export const Environment = {
	comment: "while your config-*.ts may hold sensitive data it is wise not to store it in git!!",
	isDebug: true,
	name: "test",
	serverUrl: "https://localhost:3333/",
	HttpServer: {
		cors: {
			origins: [
				"http://localhost:3334"
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