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

import {__custom, __scenario} from '@nu-art/testelot';
import {BucketWrapper, ModuleBE_Firebase} from '../../../_main';
import {generateHex, StaticLogger} from '@nu-art/ts-common';

export function makeFilesPublicTest() {
	const scenario = __scenario('Save files and delete them');
	const testFolder = 'test-folder';
	const testFilePrefix = 'test-file';
	const pathToTestFile = `${testFolder}/${testFilePrefix}`;
	let bucket: BucketWrapper;
	const pathToRemoteFile = `${pathToTestFile}-string--${generateHex(4)}.txt`;


	scenario.add(__custom(async () => {
		bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getOrCreateBucket();
	}).setLabel('Create Storage'),);

	scenario.add(__custom(async () => {
		return (await bucket.getFile(pathToRemoteFile)).write('This is a test string');
	}).setLabel('Save string to file'));

	scenario.add(__custom(async () => {
		const bucketPath = await bucket.getFile(pathToRemoteFile);
		StaticLogger.logInfo(`https://storage.googleapis.com/${bucketPath.bucket.bucketName}/${testFolder}/${pathToRemoteFile}`);
		// console.log(await bucket.getFile(`${pathToTestFile}-string.txt`))
		return (await bucket.getFile(pathToRemoteFile)).makePublic();
	}).setLabel('Making path public'));

	return scenario;
}


