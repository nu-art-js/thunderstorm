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


import {LogClient} from "./LogClient";
import {removeItemFromArray} from "../../utils/array-tools";
import {
	LogLevel,
	LogParam
} from "./types";

class BeLogged_Class {

	private clients: LogClient[] = [];
	private lineCount = 0;

	public addClient<Client extends LogClient>(client: Client) {
		if (this.clients.indexOf(client) !== -1)
			return;

		this.clients.push(client);
	}

	public removeConsole<Client extends LogClient>(client: Client) {
		if (this.clients.indexOf(client) === -1)
			return;

		removeItemFromArray(this.clients, client);
	}

	public log(tag: string, level: LogLevel, bold: boolean, ...toLog: LogParam[]): void {
		this.logImpl(tag, level, bold, toLog);
	}

	private logImpl(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		for (const client of this.clients) {
			client.log(tag, level, bold, toLog);
		}
	}


	public clearFooter() {
		for (let i = 0; i < this.lineCount + 3; i++) {
			process.stdout.write(`\n`);
		}
	}

	public rewriteConsole(lineCount: number) {
		this.lineCount = lineCount;
	}
}

export const BeLogged = new BeLogged_Class();

