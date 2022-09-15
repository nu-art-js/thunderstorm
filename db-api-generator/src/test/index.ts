/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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

import {StormTester} from '@nu-art/thunderstorm/backend-test';
import {__scenario} from '@nu-art/testelot';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {upsertTests} from './test-1--db-module/tests/upsert';
import {ModuleTest_DBModule_Test1} from './test-1--db-module/core/db-module';
import {ModuleBE_SyncManager} from '../main/backend';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore';


export const mainScenario = __scenario('Tests for base-db-api-generator.');

mainScenario.add(upsertTests());

// firebaseApps previously initialized using initializeApp()
const db = getFirestore();
connectFirestoreEmulator(db, 'localhost', 8301);

module.exports = new StormTester()
	.addModules(ModuleBE_Firebase)
	.addModules(ModuleTest_DBModule_Test1)
	.addModules(ModuleBE_SyncManager)
	.setScenario(mainScenario)
	.build();
