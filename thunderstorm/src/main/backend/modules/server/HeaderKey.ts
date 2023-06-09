/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {ApiException} from '../../exceptions';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_HttpRequest} from './consts';


export class HeaderKey {
	private readonly key: string;
	private readonly responseCode: number;

	constructor(key: string, responseCode: number = 400) {
		this.key = key;
		this.responseCode = responseCode;
	}

	get(mem: MemStorage) {
		const value = MemKey_HttpRequest.get(mem).header(this.key);
		if (!value)
			throw new ApiException(this.responseCode, `Missing expected header: ${this.key}`);

		return value;
	}
}