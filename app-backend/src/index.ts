/**
 * Created by tacb0ss on 10/07/2018.
 */
import {HttpServer} from "@nu-art/server";
import {getModule, ModuleManager} from "@nu-art/core";
import * as functions from 'firebase-functions';
import {Base64} from "js-base64";
import decode = Base64.decode;

/*
 *  SETUP, CONFIG & INIT
 */
const configAsBase64: string = functions.config().app.config;
const configAsObject = JSON.parse(decode(configAsBase64));
ModuleManager.getInstance().setConfig(configAsObject).setModuleTypes(HttpServer).init();

/*
 *  SETUP HttpServer
 */
const _urlPrefix: string = !process.env.GCLOUD_PROJECT ? "/api" : "";
const httpServer: HttpServer = getModule(HttpServer);
httpServer.resolveApi(require, __dirname, _urlPrefix, __dirname + "/main/api", __dirname + "/main/api");
httpServer.printRoutes(process.env.GCLOUD_PROJECT ? "/api" : "");
httpServer.startServer()
	.then(() => {
		console.log("Started");
	})
	.catch(reason => console.error("Error: ", reason));