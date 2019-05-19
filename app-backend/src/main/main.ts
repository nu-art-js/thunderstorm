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

import {
	BeLogged,
	createModuleManager,
	Module,
	TerminalLogClient
} from "@nu-art/core";
import {
	HttpServer,
	ServerApi
} from "@nu-art/server/HttpServer";
import {ExampleModule} from "@modules/ExampleModule";
import {Environment} from "./config";


export async function start(configAsObject: any) {
	const packageJson = require("./package.json");
	console.log(`Starting sdasdasserver v${packageJson.version} with env: ${Environment.name}`);

	BeLogged.addClient(TerminalLogClient);
	const modules: Module<any>[] =
		      [
			      HttpServer,
			      ExampleModule,
		      ];

	createModuleManager().setConfig(configAsObject).setModules(...modules).init();

	/*
	 *  SETUP HttpServer
	 */
	ServerApi.isDebug = configAsObject.isDebug;
	const _urlPrefix: string = !process.env.GCLOUD_PROJECT ? "/api" : "";
	HttpServer.resolveApi(require, __dirname, _urlPrefix, __dirname + "/api", __dirname + "/api");
	HttpServer.printRoutes(process.env.GCLOUD_PROJECT ? "/api" : "");
	return HttpServer.startServer();
}

export async function mainTerminate() {
	return HttpServer.terminate();
}
