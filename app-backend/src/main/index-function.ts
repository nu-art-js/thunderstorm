/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by tacb0ss on 10/07/2018.
 */

import * as functions from 'firebase-functions';
import {
	HttpServer,
	FirebaseModule
} from "@nu-art/server";
import {ModuleManager} from "@nu-art/core";
import {Base64} from "js-base64";
import decode = Base64.decode;

/*
 *  SETUP, CONFIG & INIT
 */
const configAsBase64: string = functions.config().app.config;
const configAsObject = JSON.parse(decode(configAsBase64));
ModuleManager.getInstance().setConfig(configAsObject).setModules(HttpServer, FirebaseModule).init();

/*
 *  SETUP Firebase
 */
FirebaseModule.createAdminSession("adam_gcm");

/*
 *  SETUP HttpServer
 */
const _urlPrefix: string = !process.env.GCLOUD_PROJECT ? "/api" : "";
HttpServer.resolveApi(require, __dirname, _urlPrefix, __dirname + "/main/api", __dirname + "/main/api");
HttpServer.printRoutes(process.env.GCLOUD_PROJECT ? "/api" : "");
HttpServer.startServer()
          .then(() => {
	          console.log("Started");
          })
          .catch((reason: Error) => console.error("Error: ", reason));


export const api = functions.https.onRequest(HttpServer.express);
