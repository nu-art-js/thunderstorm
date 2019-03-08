/**
 * Created by tacb0ss on 10/07/2018.
 */
import * as functions from 'firebase-functions';
import {httpServer} from "./services";


const _urlPrefix: string = !process.env.GCLOUD_PROJECT ? "/api" : "";
httpServer.resolveApi(require, __dirname, _urlPrefix, __dirname + "/main/api", __dirname + "/main/api");
httpServer.printRoutes(process.env.GCLOUD_PROJECT ? "/api" : "");
httpServer.start()
	.then(() => {
		console.log("Started");
	})
	.catch(reason => console.error("Error: ", reason));

export const api = functions.https.onRequest(httpServer.express);
