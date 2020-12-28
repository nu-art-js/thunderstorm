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
	Backend_ModulePack_Uploader,
	PostProcessor,
	UploaderModule
} from "@nu-art/file-upload/backend";
import {
	FileWrapper,
	FirebaseModule,
	FirestoreTransaction
} from '@nu-art/firebase/backend';
import {DB_Temp_File} from '@nu-art/file-upload/shared/types';
import {JiraBugReportIntegrator} from "@nu-art/bug-report/app-backend/modules/JiraBugReportIntegrator";

const packageJson = require("./package.json");
console.log(`Starting server v${packageJson.version} with env: ${Environment.name}`);

const modules: Module[] = [
	ValueChangedListener,
	ExampleModule,
	ForceUpgrade,
	ProjectFirestoreBackup,
	SlackModule,
	Slack_ServerApiError,
	DispatchModule,
	PushPubSubModule,
];

const postProcessor: { [k: string]: PostProcessor } = {
	default: async (transaction: FirestoreTransaction, file: FileWrapper, doc: DB_Temp_File) => {
		await FirebaseModule.createAdminSession().getDatabase().set(`/alan/testing/${file.path}`, {path: file.path, name: await file.exists()});
		console.log(file);
	}
};
UploaderModule.setPostProcessor(postProcessor);

const _exports = new Storm()
	.addModules(...Backend_ModulePack_BugReport)
	.addModules(...Backend_ModulePack_LiveDocs)
	.addModules(...Backend_ModulePack_Permissions)
	.addModules(...Backend_ModulePack_Uploader)
	.addModules(...modules)
	.setInitialRouteResolver(new RouteResolver(require, __dirname, "api"))
	.setInitialRoutePath("/api")
	.setEnvironment(Environment.name)
	.build();

BugReportModule.addTicketCreator(JiraBugReportIntegrator.openTicket)

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