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

import {createHmac} from "crypto";

export function randomNumber(range: number) {
	return Math.floor(Math.random() * (range))
}

export function randomObject<T>(items: T[]): T {
	return items[randomNumber(items.length)];
}

export function hashPasswordWithSalt(salt: string | Buffer, password: string | Buffer) {
	return createHmac('sha512', salt)
		.update(password)
		.digest('hex');
}
