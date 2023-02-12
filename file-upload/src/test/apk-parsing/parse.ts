/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import * as fs from 'fs';
import {__custom} from '@nu-art/testelot';
import {
	FileWrapper,
	ModuleBE_Firebase
} from '@nu-art/firebase/backend';
import {
	assert,
	BadImplementationException,
	StaticLogger
} from '@nu-art/ts-common';
import {read} from "fs";


const PkgReader = require('isomorphic-apk-reader');
const ApkPath = 'files-temp/pah.apk';

async function parseApkImpl(file: FileWrapper) {
	const buffer = await file.read();
	const metadata = await file.getMetadata();
// @ts-ignore
	const mediaLink = metadata.mediaLink;
	StaticLogger.logInfo(`Metadata: ${metadata}, Medialink: ${mediaLink}`);
	StaticLogger.logInfo(`File read ${file.path}`);
	// const fileName = './temp.apk';
	// @ts-ignore
	const fileName = `gs://${metadata.bucket}/${metadata.name}`;
	// await fs.promises.writeFile(fileName, buffer);
	StaticLogger.logInfo(`File wrote locally ${file.path}`);
	let manifest;
	try {
		manifest = await new Promise((res, rej) => {
			const callback = async (err: any, _manifest: any) => {
				StaticLogger.logError(err, _manifest);
				return err ? rej(err) : res(_manifest);
			};
			new PkgReader(fileName, 'apk').parse(callback);
		});
	} catch (e: any) {
		throw new BadImplementationException('Failed to parse manifest', e);
	} finally {
		StaticLogger.logInfo(`Cleaup`);
		// await fs.promises.unlink(fileName);
	}
	StaticLogger.logInfo(`Manifest: ${manifest}`);
	return manifest;
}

export const parseApk = __custom(async () => {
	const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getOrCreateBucket();
	const file = await bucket.getFile(ApkPath);

	const resp = await parseApkImpl(file);
	assert('It returned an actual manifest', !!resp, true);
}).setLabel('Parse Apk');