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

import {FirebaseScheduledFunction} from "../functions/firebase-function";
import {ProjectFirestoreBackup} from "./ProjectFirestoreBackup";
import {FirebaseModule} from "../FirebaseModule";
import {
	currentTimeMillies,
	Day
} from "@intuitionrobotics/ts-common";

type Config = {
	backupIntervalMs: number
}

export class ProjectBackupScheduler_Class
	extends FirebaseScheduledFunction<Config> {

	constructor() {
		super();
		this.setDefaultConfig({backupIntervalMs: Day});
		this.addRunningCondition(async () => {
			let lastSuccess = await FirebaseModule.createAdminSession().getDatabase().get<number>("/_firestore-backup");
			if (!lastSuccess)
				lastSuccess = 0;

			return currentTimeMillies() - lastSuccess > this.config.backupIntervalMs * 0.98;
		});

	}

	onScheduledEvent = async (): Promise<any> => {
		try {
			await ProjectFirestoreBackup.backupProject(`scheduled function: ${this.getName()}`);
			await FirebaseModule.createAdminSession().getDatabase().set<number>("/_firestore-backup", currentTimeMillies());
		} catch (e) {
			this.logError("Error backing up firestore", e);
		}
	};
}

export const ProjectBackupScheduler = new ProjectBackupScheduler_Class();
