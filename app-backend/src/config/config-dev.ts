module.exports = {
	isDebug: true,
	name: "dev",
	serverUrl: "https://localhost:3000/",
	server: {
		host: "localhost",
		port: "3000",
		crossDomainHeader: "http://localhost:3010/*"
	}
};