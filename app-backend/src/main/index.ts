/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
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

// tslint:disable-next-line:no-import-side-effect
import 'module-alias/register';
import * as functions from "firebase-functions";
import {
	AxiosHttpModule,
	ForceUpgrade,
	RouteResolver,
	Storm
} from "@nu-art/thunderstorm/backend";
import {Environment} from "./config";
import {
	DispatchModule,
	ExampleModule
} from "@modules/ExampleModule";
import {Backend_ModulePack_LiveDocs} from "@nu-art/live-docs/backend";
import {
	__stringify,
	_setTimeout,
	Minute,
	Module
} from "@nu-art/ts-common";
import {Backend_ModulePack_Permissions} from "@nu-art/permissions/backend";
import {
	Backend_ModulePack_BugReport,
	BugReportModule
} from "@nu-art/bug-report/backend";
import {ProjectFirestoreBackup} from "@nu-art/firebase/backend-firestore-backup";
import {PushPubSubModule} from '@nu-art/push-pub-sub/backend';
import {ValueChangedListener} from "@modules/ValueChangedListener";
import {
	Slack_ServerApiError,
	SlackModule
} from "@nu-art/storm/slack";
import {
	AssetsUploadingModuleBE,
	Backend_ModulePack_Uploader,
	ServerUploaderModule,
} from "@nu-art/file-upload/backend";
import {
	FileWrapper,
	FirebaseModule
} from '@nu-art/firebase/backend';
import {Firebase_ExpressFunction} from '@nu-art/firebase/backend-functions';
import {JiraBugReportIntegrator} from "@nu-art/bug-report/app-backend/modules/JiraBugReportIntegrator";
import {CollectionChangedListener} from "@modules/CollectionChangedListener";
import {PubsubExample} from "@modules/PubsubExample";
import {DB_Asset} from '@nu-art/file-upload';

const packageJson = require("./package.json");
console.log(`Starting server v${packageJson.version} with env: ${Environment.name}`);

const modules: Module[] = [
	ValueChangedListener,
	CollectionChangedListener,
	ExampleModule,
	ForceUpgrade,
	ProjectFirestoreBackup,
	SlackModule,
	Slack_ServerApiError,
	DispatchModule,
	PushPubSubModule,
	AxiosHttpModule,
	PubsubExample
];

AxiosHttpModule.setDefaultConfig({origin: 'https://us-central1-thunderstorm-staging.cloudfunctions.net/api/'});

AssetsUploadingModuleBE.register("default", {
	validator: async (file: FileWrapper, doc: DB_Asset) => {
		await FirebaseModule.createAdminSession().getDatabase().set(`/alan/testing/${file.path}`, {path: file.path, name: await file.exists()});

		const resp = ServerUploaderModule.upload([{file: await file.read(), name: 'myTest.txt', mimeType: doc.mimeType}]);

		await new Promise<void>(res => {
			_setTimeout(() => {
				console.log(ServerUploaderModule.getFullFileInfo(resp[0].feId));
				res();
			}, 0.5 * Minute);
		});

		console.log(file);
	}
});
// BucketListener.setDefaultConfig({memory: "1GB", timeoutSeconds: 540})
Firebase_ExpressFunction.setConfig({memory: "1GB", timeoutSeconds: 540});
const _exports = new Storm()
	.addModules(...Backend_ModulePack_BugReport)
	.addModules(...Backend_ModulePack_LiveDocs)
	.addModules(...Backend_ModulePack_Permissions)
	.addModules(...Backend_ModulePack_Uploader)
	.addModules(...modules)
	.setInitialRouteResolver(new RouteResolver(require, __dirname, "api"))
	.setInitialRoutePath("/api")
	.setEnvironment(Environment.name)
	.build(async () => {
		// const response = await AxiosHttpModule
		// 	.createRequest<ExampleSetMax>(HttpMethod.POST, 'internal-be-request')
		// 	.setUrl('http://localhost:5000/thunderstorm-staging/us-central1/api/v1/sample/set-max')
		// 	.setJsonBody({n: 65})
		// 	.setOnError((request, errorData) => {
		// 		console.log('I got error', errorData);
		// 	})
		// 	.setTimeout(30000)
		// 	.execute();
		// console.log('I got respose', response);
	});

BugReportModule.addTicketCreator(JiraBugReportIntegrator.openTicket);

_exports.logTest = functions.database.ref('triggerLogs').onWrite((change, context) => {
	console.log('LOG_TEST FUNCTION! -- Logging string');
	console.log(`Changed from: ${change.before} to --> ${change.after} with context: ${__stringify(context)}`);
	console.log({
		            firstProps: 'String prop',
		            secondProps: {
			            a: 'Nested Object Prop',
			            b: 10000
		            }
	            });
});

module.exports = _exports;