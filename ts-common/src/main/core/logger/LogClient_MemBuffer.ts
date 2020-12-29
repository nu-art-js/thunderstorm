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

import {LogClient_BaseRotate} from "./LogClient_BaseRotate";


export class LogClient_MemBuffer
	extends LogClient_BaseRotate {

	readonly buffers: string[] = [""];

	constructor(name: string, maxEntries = 10, maxSize = 1024 * 1024) {
		super(name, maxEntries, maxSize);
	}

	protected printLogMessage(log: string) {
		this.buffers[0] += log;
	}

	protected cleanup(): void {
	}

	protected rotateBuffer(fromIndex: number, toIndex: number): void {
		this.buffers[toIndex] = this.buffers[fromIndex];
	}

	protected prepare(): void {
		this.buffers[0] = "";
	}
}
