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

import {
	BadImplementationException,
	currentTimeMillies
} from "@nu-art/ts-common";
import {
	Bucket,
	File,
	GetSignedUrlConfig,
	MakeFilePublicResponse,
} from "@google-cloud/storage";
import {
	FirebaseType_Metadata,
	FirebaseType_Storage
} from "./types";
import {FirebaseSession} from "../auth/firebase-session";
import {FirebaseBaseWrapper} from "../auth/FirebaseBaseWrapper";


export class StorageWrapper
	extends FirebaseBaseWrapper {

	readonly storage: FirebaseType_Storage;

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.storage = firebaseSession.app.storage();
	}

	async getOrCreateBucket(bucketName?: string): Promise<BucketWrapper> {
		let _bucketName = bucketName;
		if (!_bucketName)
			_bucketName = `gs://${this.firebaseSession.getProjectId()}.appspot.com`;

		if (!_bucketName.startsWith("gs://"))
			throw new BadImplementationException("Bucket name MUST start with 'gs://'");

		const bucket = (await this.storage.bucket(_bucketName).get({autoCreate: true}))[0];
		// @ts-ignore
		return new BucketWrapper(_bucketName, bucket, this);
	}
}

export class BucketWrapper {
	readonly bucketName: string;
	readonly bucket: Bucket;
	readonly storage: StorageWrapper;

	private constructor(bucketName: string, bucket: Bucket, storage: StorageWrapper) {
		this.bucketName = bucketName;
		this.bucket = bucket;
		this.storage = storage;
	}

	async getFile(pathToRemoteFile: string): Promise<FileWrapper> {
		// @ts-ignore
		return new FileWrapper(pathToRemoteFile, await this.bucket.file(pathToRemoteFile), this);
	}

	async listFiles(folder: string = "", filter: (file: File) => boolean = () => true): Promise<File[]> {
		const filteredFiles: File[] = [];
		await this.iterateOverFiles(folder, filter, async (file: File) => filteredFiles.push(file));
		return filteredFiles;
	}

	async deleteFiles(folder: string = "", filter: (file: File) => boolean = () => true): Promise<void> {
		await this.iterateOverFiles(folder, filter, (file: File) => file.delete())
	}

	private async iterateOverFiles(folder: string, filter: (file: File) => boolean, action: (file: File) => Promise<any>) {
		return new Promise((resolve, reject) => {
			const callback = async (err: Error | null, files?: File[], nextQuery?: {}) => {
				if (err)
					return reject(err);

				if (files) {
					await Promise.all(files.filter(filter).map(file => action(file)))
				}

				if (!nextQuery)
					return resolve();

				this.bucket.getFiles(nextQuery, callback);
			};

			this.bucket.getFiles({
				                     prefix: folder,
				                     autoPaginate: false
			                     }, callback);
		});
	}
}

export class FileWrapper {
	readonly file: File;
	readonly path: string;
	readonly bucket: BucketWrapper;

	private constructor(path: string, file: File, bucket: BucketWrapper) {
		this.file = file;
		this.bucket = bucket;
		this.path = path;
	}

	async getWriteSecuredUrl(contentType: string, expiresInMs: number) {
		const options: GetSignedUrlConfig = {
			action: 'write',
			contentType: contentType,
			expires: currentTimeMillies() + expiresInMs,
		};
		return this.getSignedUrl(options);
	}

	async getReadSecuredUrl(contentType: string, expiresInMs: number) {
		const options: GetSignedUrlConfig = {
			action: 'read',
			expires: currentTimeMillies() + expiresInMs,
		};
		return this.getSignedUrl(options);
	}


	async exists(): Promise<boolean> {
		return (await this.file.exists())[0];
	}

	async write(data: string | number | object | boolean) {
		if (Buffer.isBuffer(data))
			return this.file.save(data);

		switch (typeof data) {
			case "function":
			case "symbol":
			case "bigint":
			case "undefined":
				throw new BadImplementationException(`Cannot save file: ${this.file.name}, data is ${typeof data}`);

			case "object":
				return this.file.save(JSON.stringify(data));

			case "boolean":
			case "number":
			case "string":
				return this.file.save(`${data}`);
		}
	}

	async read(): Promise<Buffer> {
		const downloadResponse = await this.file.download();
		return downloadResponse[0]
	}

	async delete() {
		if (!await this.file.exists())
			return;

		return this.file.delete();
	}

	private async getSignedUrl(options: GetSignedUrlConfig) {
		const results = await this.file.getSignedUrl(options);
		const url = results[0];

		return {
			fileName: this.path,
			securedUrl: url,
			publicUrl: encodeURI(`https://storage.googleapis.com/${this.bucket.bucketName.replace(`gs://`, '')}${this.path}`)
		};
	}

	async makePublic(): Promise<MakeFilePublicResponse> {
		return this.file.makePublic();
	}

	async setMetadata(metadata: FirebaseType_Metadata, options?: object): Promise<FirebaseType_Metadata> {
		return (await this.file.setMetadata(metadata, options))[0]
	}

	async getMetadata(options?: object): Promise<FirebaseType_Metadata> {
		return (await this.file.getMetadata(options))[0]
	}
}