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
	DatabaseWrapper,
	FirebaseModule
} from "../../_main";
import {
	__custom,
	ErrorPolicy
} from "@nu-art/testelot";

export class FirebaseDatabaseTester {

	processDirty(label: string, processor: (db: DatabaseWrapper) => Promise<void>) {
		return this.process(label, processor, false).setErrorPolicy(ErrorPolicy.ContinueOnError);
	}

	processClean(label: string, processor: (db: DatabaseWrapper) => Promise<void>) {
		return this.process(label, processor, true).setErrorPolicy(ErrorPolicy.ContinueOnError);
	}

	private process(label: string, processor: (db: DatabaseWrapper) => Promise<void>, clean: boolean) {
		return __custom(async () => {
			const db = FirebaseModule.createAdminSession().getDatabase();
			if (clean) {
				const config = await db.get('/_config');
				await db.delete('/', '/');
				config && await db.set('/_config', config);
			}
			return processor(db)
		}).setLabel(label);
	}
}

export const myDb = new FirebaseDatabaseTester();