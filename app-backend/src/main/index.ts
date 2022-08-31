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
import {AxiosHttpModule, ModuleBE_ForceUpgrade, HttpServer, RouteResolver_ModulePath, Storm} from '@nu-art/thunderstorm/backend';
import {Environment} from './config';
import {DispatchModule, ExampleModule} from '@modules/ExampleModule';
import {ModulePack_Backend_LiveDocs} from '@nu-art/live-docs/backend';
import {Module} from '@nu-art/ts-common';
import {ModulePack_Backend_Permissions} from '@nu-art/permissions/backend';
import {JiraBugReportIntegrator, ModuleBE_BugReport, ModulePack_Backend_BugReport} from '@nu-art/bug-report/backend';
import {ModuleBE_PushPubSub} from '@nu-art/push-pub-sub/backend';
import {Slack_ServerApiError, ModuleBE_Slack} from '@nu-art/storm/slack';
import {ModulePack_Backend_Uploader,} from '@nu-art/file-upload/backend';
import {Firebase_ExpressFunction} from '@nu-art/firebase/backend-functions';
import {CollectionChangedListener} from '@modules/CollectionChangedListener';
import {PubsubExample} from '@modules/PubsubExample';


const packageJson = require('./package.json');
console.log(`Starting server v${packageJson.version} with env: ${Environment.name}`);

const modules: Module[] = [
	CollectionChangedListener,
	ExampleModule,
	ModuleBE_ForceUpgrade,
	ModuleBE_Slack,
	Slack_ServerApiError,
	DispatchModule,
	ModuleBE_PushPubSub,
	AxiosHttpModule,
	PubsubExample
];

AxiosHttpModule.setDefaultConfig({origin: 'https://us-central1-thunderstorm-staging.cloudfunctions.net/api/'});

Firebase_ExpressFunction.setConfig({memory: '1GB', timeoutSeconds: 540});
const _exports = new Storm()
	.addModules(...ModulePack_Backend_BugReport)
	.addModules(...ModulePack_Backend_LiveDocs)
	.addModules(...ModulePack_Backend_Permissions)
	.addModules(...ModulePack_Backend_Uploader)
	.addModules(...modules)
	.setInitialRouteResolver(new RouteResolver_ModulePath(HttpServer.express, __dirname))
	.setEnvironment(Environment.name)
	.build();

ModuleBE_BugReport.addTicketCreator(JiraBugReportIntegrator.openTicket);

module.exports = _exports;

// type TypedMap<CloudFunction<any>>
//
// module.exports = {
// 	scheduler: functions.pubsub.schedule(this.schedule).onRun(async () => {
// 		return this.handleCallback(() => this._onScheduledEvent());
// 	})
// }