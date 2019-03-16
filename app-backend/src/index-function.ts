/**
 * Created by tacb0ss on 10/07/2018.
 */

import * as functions from 'firebase-functions';
import {HttpServer, FirebaseModule} from "@nu-art/server";
import {getModule, ModuleManager} from "@nu-art/core";
import {Base64} from "js-base64";
import decode = Base64.decode;

/*
 *  SETUP, CONFIG & INIT
 */
const configAsBase64: string = functions.config().app.config;
const configAsObject = JSON.parse(decode(configAsBase64));
ModuleManager.getInstance().setConfig(configAsObject).setModuleTypes(HttpServer, FirebaseModule).init();

/*
 *  SETUP Firebase
 */
const firebase: FirebaseModule = getModule(FirebaseModule);
firebase.createAdminSession("adam_gcm");

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
	.catch((reason: Error) => console.error("Error: ", reason));


export const api = functions.https.onRequest(httpServer.express);
