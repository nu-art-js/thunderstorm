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

import {
	__custom,
	__scenario,
	AppTester
} from "@nu-art/testelot";
import {
	FirebaseModule,
	FirebaseModule_Class
} from "@nu-art/firebase/backend";

import * as fs from "fs";
import {
	assert,
	ImplementationMissingException
} from "@nu-art/ts-common";

const PkgReader = require("isomorphic-apk-reader");
const ApkPath = 'files-temp/kaspero.apk';
const mainScenario = __scenario("File Uploading Testing");
mainScenario.add(__custom(async () => {
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
}).setLabel('Parse Apk'));


class MyTester
	extends AppTester {

	prepare() {
		console.log('damn');
		FirebaseModule_Class.localAdminConfigId = "test-permissions";

		const serviceAccount = this.resolveServiceAccount();

		FirebaseModule.setDefaultConfig({"test-permissions": serviceAccount});
	}

	private resolveServiceAccount() {
		let pathToServiceAccount = process.env.npm_config_service_account || process.argv.find((arg: string) => arg.startsWith("--service-account="));
		if (!pathToServiceAccount)
			throw new ImplementationMissingException("could not find path to service account!!!");

		pathToServiceAccount = pathToServiceAccount.replace("--service-account=", "");
		return JSON.parse(fs.readFileSync(pathToServiceAccount, "utf8"))
	}

	build(): void {
		console.log('ciao');
		super.build()
	}
}

module.exports = new MyTester()
	.addModules(FirebaseModule)
	.setScenario(mainScenario)
	.build();
