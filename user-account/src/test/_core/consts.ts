/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import {generateHex, ModuleManager} from '@nu-art/ts-common';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase/backend';
import {ModuleBE_v2_AccountDB, ModuleBE_v2_SessionDB} from '../../main/backend';
import {ModuleBE_v2_SyncManager} from '@nu-art/db-api-generator/backend/ModuleBE_v2_SyncManager';
import {Storm} from '@nu-art/thunderstorm/backend';
import {RouteResolver_Dummy} from '@nu-art/thunderstorm/backend/modules/server/route-resolvers/RouteResolver_Dummy';


const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
	isEmulator: true
};

const modules = [
	ModuleBE_v2_SyncManager,
	ModuleBE_v2_AccountDB,
	ModuleBE_v2_SessionDB
];

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

// @ts-ignore
ModuleManager.resetForTests();


new Storm()
	.addModulePack(modules)
	.setConfig({isDebug: true})
	.setInitialRouteResolver(new RouteResolver_Dummy())
	.init()
	.build();


