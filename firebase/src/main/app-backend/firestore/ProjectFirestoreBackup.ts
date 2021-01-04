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
import {File} from "@google-cloud/storage";

import * as firestore from "@google-cloud/firestore";
import {FirebaseModule} from "../FirebaseModule";
import {JWTInput} from "google-auth-library";
import {FirebaseProjectCollections} from "../../shared/types";
import {
	__stringify,
	_logger_logException,
	createReadableTimestampObject,
	currentTimeMillies,
	Day,
	dispatch_onServerError,
	filterDuplicates,
	Format_YYYYMMDD_HHmmss,
	Module,
	parseTimeString,
	ServerErrorSeverity,
	Timestamp
} from "@ir/ts-common";
import {BucketWrapper} from "../storage/StorageWrapper";

type Config = {
	bucket: string
	path: string
	expirationDays: number
}

export class ProjectFirestoreBackup_Class
	extends Module<Config> {

	async backupProject(initiator: string) {
		this.logVerbose(`Listing projects and collections...`);
		const toBackup: FirebaseProjectCollections[] = FirebaseModule.listCollectionsInModules();

		this.logVerbose(`Project backup config: `, toBackup);
		const timestamp = createReadableTimestampObject(Format_YYYYMMDD_HHmmss);
		await Promise.all(toBackup.map(projectToBackup => this.backupFirebaseProject(initiator, timestamp, projectToBackup)));
	}

	private async backupFirebaseProject(initiator: string, timestamp: Timestamp, projectToBackup: FirebaseProjectCollections) {
		const projectId = FirebaseModule.getLocalProjectId();
		if (projectToBackup.projectId !== projectId)
			return this.logVerbose(`Will not backup a firestore from another project: ${projectToBackup.projectId}`);

		const bucketName = `gs://${this.config.bucket || `${projectId}.appspot.com`}`;

		const backupRootFolder = `${this.config.path || "firestore-backup"}`;
		const currentBackupFolder = `${backupRootFolder}/${timestamp.pretty}`;

		const adminSession = FirebaseModule.createAdminSession(projectId);
		const storage = adminSession.getStorage();
		const bucket = await storage.getOrCreateBucket(bucketName);

		const projectAuth: JWTInput = FirebaseModule.getProjectAuth(projectToBackup.projectId) as JWTInput;
		const client = new firestore.v1.FirestoreAdminClient(projectAuth);

		const exportConfig = {
			name: client.databasePath(projectToBackup.projectId, '(default)'),
			outputUriPrefix: `${bucketName}/${currentBackupFolder}/${projectToBackup.projectId}`,
			collectionIds: filterDuplicates(projectToBackup.collections)
		};

		this.logVerbose("projectAuth:", projectAuth);
		try {
			this.logVerbose("exportConfig:", exportConfig);
			await client.exportDocuments(exportConfig);

			this.logVerbose("Create a .creator file");
			const file = await bucket.getFile(`${currentBackupFolder}/.creator`);
			await file.write({creator: initiator});
		} catch (e) {
			const errorMessage = `Error backing up firestore with config:\n ${__stringify(exportConfig, true)}\nError: ${_logger_logException(e)}`;
			await dispatch_onServerError.dispatchModuleAsync([ServerErrorSeverity.Critical, this, errorMessage]);
			throw e;
		}

		try {
			await this.deleteOldBackups(bucket, backupRootFolder);
		} catch (e) {
			const errorMessage = `Error deleting old firestore backups for config:\n ${__stringify(exportConfig, true)}\nError: ${_logger_logException(e)}`;
			await dispatch_onServerError.dispatchModuleAsync([ServerErrorSeverity.Warning, this, errorMessage]);
			throw e;
		}
	}

	private async deleteOldBackups(bucket: BucketWrapper, backupRootFolder: string) {
		await bucket.deleteFiles(`${backupRootFolder}`, (file: File) => {
			const match = file.name.match(/([0-9-:_]{19})/);
			if (!match)
				return false;

			const backupTimestamp = parseTimeString(match[1], Format_YYYYMMDD_HHmmss);
			const delta = currentTimeMillies() - backupTimestamp;
			return delta > (this.config.expirationDays || 10) * Day;
		});
	}
}

export const ProjectFirestoreBackup = new ProjectFirestoreBackup_Class();