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
	__custom,
	__scenario
} from "@nu-art/testelot";
import {
	BucketWrapper,
	FirebaseModule
} from "../../../_main";
import {File} from "@google-cloud/storage";
import {assert} from "@nu-art/ts-common";

const metadata = {
	my: 'custom',
	properties: 'go here'
}

export function saveAndDeleteFilesTest() {
	const scenario = __scenario("Save files and delete them");
	const testFolder = "test-folder";
	const testFilePrefix = "test-file";
	const pathToTestFile = `${testFolder}/${testFilePrefix}`;
	let bucket: BucketWrapper;

	scenario.add(__custom(async () => {
		bucket = await FirebaseModule.createAdminSession().getStorage().getOrCreateBucket();
	}).setLabel("Create Storage"),);

	scenario.add(__custom(async () => {
		return (await bucket.getFile(`${pathToTestFile}-string.txt`)).write("This is a test string");
	}).setLabel("Save string to file"));

	scenario.add(__custom(async () => {
		return (await bucket.getFile(`${pathToTestFile}-number.txt`)).write(79097234);
	}).setLabel("Save number to file"));

	scenario.add(__custom(async () => {
		return (await bucket.getFile(`${pathToTestFile}-object.txt`)).write({test: "object", nested: {another: "other object"}})
	}).setLabel("Save object to file"));

	scenario.add(__custom(async () => {
		return (await bucket.getFile(`${pathToTestFile}-object.txt`)).setMetadata(metadata);
	}).setLabel("Set metadata for obj file"));

	scenario.add(__custom(async () => {
		const meta = await (await bucket.getFile(`${pathToTestFile}-object.txt`)).getMetadata();
		assert("Metadata doesn't match expected", metadata, meta.metadata);
	}).setLabel("Save object to file"));

	scenario.add(__custom(async () => {
		const files = await bucket.listFiles(testFolder, (file: File) => file.name.includes(`${pathToTestFile}`));
		assert("Expected 3 files.. ", 3, files.length);
	}).setLabel("Assert three files found"));

	scenario.add(__custom(async () => {
		return bucket.deleteFiles(testFolder, (file: File) => file.name.includes(`${pathToTestFile}`));
	}).setLabel("delete test files"));

	scenario.add(__custom(async () => {
		const files = await bucket.listFiles(testFolder, (file: File) => file.name.includes(`${pathToTestFile}`));
		assert("Expected 0 files.. ", 0, files.length);
	}).setLabel("Assert No files found"));

	return scenario;
}
