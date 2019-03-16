/**
 * Created by tacb0ss on 10/07/2018.
 */
import {HttpServer} from "@nu-art/server";
import {getModule, ModuleManager} from "@nu-art/core";

/*
 *  SETUP, CONFIG & INIT
 */
const config = require("./config/config-dev");
ModuleManager.getInstance().setConfig(config).setModuleTypes(HttpServer).init();

const httpServer: HttpServer = getModule(HttpServer);
httpServer.resolveApi(require, __dirname, "/api", __dirname + "/main/api", __dirname + "/main/api");
httpServer.startServer()
	.then(() => {
		console.log("Started");
	})
	.catch(reason => console.error("Error: ", reason));