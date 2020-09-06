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

import * as fs from "fs";
import { __custom } from "@nu-art/testelot";
import { FirebaseModule } from "@nu-art/firebase/backend";
import { assert } from "@nu-art/ts-common";
const PkgReader = require("isomorphic-apk-reader");
const ApkPath = 'files-temp/kaspero.apk';
export const parseApk = __custom(async () => {
	const bucket = await FirebaseModule.createAdminSession().getStorage().getOrCreateBucket();
	const file = await bucket.getFile(ApkPath);
	const buffer = await file.read();
	const fileName = 'kasper.apk';
	fs.writeFileSync(fileName, buffer);
	let resp;
	try {
		resp = await new Promise((res, rej) => {
			const callback = async (err: any, manifest: any) => {
				return err ? rej(err) : res(manifest)
			};
			new PkgReader(fileName, 'apk').parse(callback);
		});
	} finally {
		fs.unlinkSync(fileName)
	}

	assert('It returned an actual manifest', !!resp, true)
}).setLabel('Parse Apk');