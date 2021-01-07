/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	__scenario,
	__custom,
	Scenario
} from "@intuitionrobotics/testelot";
import {
	FirebaseModule,
	FirestoreCollection,
	ProjectFirestoreBackup
} from "../../_main";
import {Module} from "@intuitionrobotics/ts-common";

export const testFirestoreBackup: Scenario = __scenario("test-project-backup");
testFirestoreBackup.add(__custom(async () => {
	await TestModuleThatUsesCollection.deleteAllDocs();
	await TestModuleThatUsesCollection.insertTestDocument({label: "doc1"});
	await TestModuleThatUsesCollection.insertTestDocument({label: "doc2"});
}).setLabel("Populating collection"));

testFirestoreBackup.add(__custom(async () => {
	await ProjectFirestoreBackup.backupProject("automation-test");
}).setLabel("Backing up project.."));

class TestModuleThatUsesCollection_Class
	extends Module {
	private collection!: FirestoreCollection<any>;

	protected init(): void {
		this.collection = FirebaseModule.createAdminSession().getFirestore().getCollection("test-collection1");
	}

	async deleteAllDocs() {
		await this.collection.deleteAll();
	}

	async insertTestDocument(item: any) {
		await this.collection.insert(item);
	}
}

export const TestModuleThatUsesCollection = new TestModuleThatUsesCollection_Class();