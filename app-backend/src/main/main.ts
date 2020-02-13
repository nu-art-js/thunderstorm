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
	LogClient_Terminal,
	Module
} from "@nu-art/ts-common";
import {
	HttpServer,
	RouteResolver,
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {ExampleModule} from "@modules/ExampleModule";
import {Environment} from "./config";
import {LiveDocsModule} from "@nu-art/live-docs/backend";
import {FirebaseModule} from "@nu-art/firebase/backend";
import {
	AccessLevelPermissionsDB,
	ApiPermissionsDB,
	DomainPermissionsDB,
	ProjectPermissionsDB
} from "@nu-art/permissions/backend";

export async function start(configAsObject: any) {
	const packageJson = require("./package.json");
	console.log(`Starting server v${packageJson.version} with env: ${Environment.name}`);

	BeLogged.addClient(LogClient_Terminal);
	const modules: Module<any>[] =
		      [
			      HttpServer,
			      FirebaseModule,
			      LiveDocsModule,
			      ProjectPermissionsDB,
			      DomainPermissionsDB,
			      AccessLevelPermissionsDB,
			      ApiPermissionsDB,
			      ExampleModule,
		      ];

	createModuleManager().setConfig(configAsObject).setModules(...modules).init();

	/*
	 *  SETUP HttpServer
	 */
	ServerApi.isDebug = configAsObject.isDebug;
	// HttpServer.resolveApi(require, __dirname, _urlPrefix, __dirname + "/api", __dirname + "/api");
	HttpServer.resolveApi(new RouteResolver(require, __dirname, "api"), !process.env.GCLOUD_PROJECT ? "/api" : "");
	HttpServer.printRoutes(process.env.GCLOUD_PROJECT ? "/api" : "");
	return HttpServer.startServer();
}

export async function mainTerminate() {
	return HttpServer.terminate();
}
