/*
 * A backend boilerplate with example apis
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
	generateHex,
	Module
} from "@thunder-storm/common";
import {ModuleBE_Firebase} from "@thunder-storm/firebase/backend";

type Type = {
	id: number
	name: string,
	other?: string
}

type Config = {}
const testCollection = 'test-unique-type';

export class TestModule_Class
	extends Module<Config> {

	protected init(): void {
		this.startTest();
	}

	private startTest() {
		this.runAsync('Running test', async () => {
			const fs = ModuleBE_Firebase.createAdminSession().getFirestore();
			const col = fs.getCollection<Type>(testCollection, ["id"]);
			await fs.deleteCollection(testCollection);

			await col.insertAll([1, 2, 3, 4, 5].map(id => ({
				id,
				name: generateHex(8),
				other: `${generateHex(8)}_${id}`,
			})));

			await col.patch({id: 3, name: 'memeAlanBen'})
		})
	}
}

export const TestModule = new TestModule_Class();
