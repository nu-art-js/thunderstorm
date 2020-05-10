/*
 * ts-common is the basic building blocks of our typescript projects
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
	deepClone,
	sortArray
} from "../index";

export class PermissionCategory<P extends number> {
	readonly key: string;
	readonly levels: string[];
	readonly permissionsEnum: any;
	readonly defaultValue: P;

	constructor(key: string, permissionsEnum: any, defaultValue: P) {
		this.key = key;
		this.permissionsEnum = permissionsEnum;
		this.defaultValue = defaultValue;

		const _levels: string[] = Object.keys(permissionsEnum).filter(value => isNaN(parseInt(value)));
		this.levels = sortArray(_levels, (_key: string) => permissionsEnum[_key]).reverse();
	}

	getClosestMatch(permission: number) {
		return deepClone(this.levels).reverse().find(((level: string) => this.permissionsEnum[level] <= permission))
	}
}
