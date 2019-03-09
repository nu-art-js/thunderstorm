/**
 * Created by tacb0ss on 10/07/2018.
 */
import * as functions from 'firebase-functions';
import {HttpServer} from "@nu-art/server";
import {ModuleManager} from "@nu-art/core";


const _urlPrefix: string = !process.env.GCLOUD_PROJECT ? "/api" : "";

const httpServer: HttpServer = ModuleManager.getModule(HttpServer);
httpServer.resolveApi(require, __dirname, _urlPrefix, __dirname + "/main/api", __dirname + "/main/api");
httpServer.printRoutes(process.env.GCLOUD_PROJECT ? "/api" : "");
httpServer.startServer()
	.then(() => {
		console.log("Started");
	})
	.catch(reason => console.error("Error: ", reason));

// export const api = functions.https.onRequest(httpServer.express);
