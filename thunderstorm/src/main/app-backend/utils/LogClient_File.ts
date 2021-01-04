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

import {LogClient_BaseRotate} from "@ir/ts-common";
import * as fs from "fs";
import {WriteStream} from "fs";


export class LogClient_File
	extends LogClient_BaseRotate {

	private pathToFolder: string;
	private buffer!: WriteStream;

	constructor(name: string, pathToFolder: string, maxEntries = 10, maxSize = 1024 * 1024) {
		super(name, maxEntries, maxSize);
		this.pathToFolder = pathToFolder;
		if (!fs.existsSync(pathToFolder))
			fs.mkdirSync(pathToFolder, {recursive: true});

		const defaultLogfile = this.getFileName();
		if (fs.existsSync(defaultLogfile))
			this.bufferSize = fs.statSync(`${defaultLogfile}`).size;

		this.prepare();
	}


	private getFileName(index = 0) {
		return `${this.pathToFolder}/${this.name}-${index}.txt`;
	}

	protected printLogMessage(log: string) {
		this.buffer.write(log);
	}

	protected rotateBuffer(fromIndex: number, toIndex: number): void {
		if (fs.existsSync(this.getFileName(fromIndex))) {
			console.log(`rotating ${fromIndex} => ${toIndex}`);
			fs.renameSync(this.getFileName(fromIndex), this.getFileName(toIndex));
		}
	}

	protected cleanup(): void {
		const fileName = this.getFileName(this.maxEntries - 1);
		if (fs.existsSync(fileName))
			fs.unlinkSync(fileName);
		this.buffer.end();
	}

	protected prepare(): void {
		this.buffer = fs.createWriteStream(this.getFileName(), {flags: 'a'});
	}
}