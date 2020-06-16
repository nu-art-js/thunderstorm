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

import {FirebaseTester} from "./_core/Firebase-Tester";
import {testCollections} from "./firestore/collection/test-collections";
import {TestModuleThatUsesCollection,} from "./firestore/backup/test-project-backup";
import {ProjectFirestoreBackup} from "../main/app-backend/firestore/ProjectFirestoreBackup";
import {FirebaseModule} from "../main/app-backend/FirebaseModule";
import {testStorage} from "./firestore/storage/test-storage";
import {__scenario} from "@nu-art/testelot";
import {testDatabase} from "./database/test-database";

const mainScenario = __scenario("Firebase testing");
// mainScenario.add(testDatabase)
mainScenario.add(testCollections);
// mainScenario.add(testStorage);
// mainScenario.add(testFirestoreBackup);
module.exports = new FirebaseTester()
	.addModules(FirebaseModule, TestModuleThatUsesCollection, ProjectFirestoreBackup)
	.setScenario(mainScenario)
	.build();