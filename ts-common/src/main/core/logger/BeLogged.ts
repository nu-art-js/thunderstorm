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

import {LogClient} from './LogClient.js';
import {removeItemFromArray} from '../../utils/array-tools.js';
import {LogLevel, LogParam} from './types.js';


/**
 * Central logging manager that distributes log messages to all registered log clients.
 * 
 * BeLogged acts as a dispatcher - when a log message is sent, it forwards it to all
 * registered LogClient instances. This allows multiple output destinations simultaneously
 * (e.g., console + file + remote logging).
 * 
 * Log clients are added via `addClient()` and can be removed via `removeClient()`.
 * Each client can have its own filter and prefix composer.
 */
class BeLogged_Class {

	/** Array of registered log clients */
	private clients: LogClient[] = [];
	/** Line count for console rewriting (used by some clients) */
	private lineCount = 0;

	/**
	 * Registers a log client to receive all log messages.
	 * 
	 * The client's `init()` method is called immediately. If the client is already
	 * registered, this method does nothing (no duplicate registration).
	 * 
	 * @param client - LogClient instance to register
	 */
	public addClient<Client extends LogClient>(client: Client) {
		if (this.clients.indexOf(client) !== -1)
			return;

		client.init();
		this.clients.push(client);
	}

	/**
	 * Removes a log client (alias for removeClient for backwards compatibility).
	 * 
	 * @param client - LogClient instance to remove
	 */
	public removeConsole<Client extends LogClient>(client: Client) {
		this.removeClient(client);
	}

	/**
	 * Removes a log client from the registry.
	 * 
	 * The client's `stop()` method is called for cleanup. If the client is not
	 * registered, this method does nothing.
	 * 
	 * @param client - LogClient instance to remove
	 */
	public removeClient<Client extends LogClient>(client: Client) {
		if (this.clients.indexOf(client) === -1)
			return;

		removeItemFromArray(this.clients, client);
		client.stop();
	}

	/**
	 * Logs a message to all registered clients.
	 * 
	 * @param tag - Logger tag/identifier
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param toLog - Values to log (spread arguments)
	 */
	public log(tag: string, level: LogLevel, bold: boolean, ...toLog: LogParam[]): void {
		this.logImpl(tag, level, bold, toLog);
	}

	/**
	 * Internal implementation that distributes the log message to all clients.
	 * 
	 * Creates a copy of the toLog array for each client to prevent mutation issues.
	 * 
	 * @param tag - Logger tag/identifier
	 * @param level - Log level
	 * @param bold - Whether to apply bold formatting
	 * @param toLog - Array of values to log
	 */
	private logImpl(tag: string, level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		for (const client of this.clients) {
			client.log(tag, level, bold, [...toLog]);
		}
	}

	/**
	 * Clears footer lines from console output.
	 * 
	 * Used by console-based log clients to clear previously written footer content.
	 * Writes newlines to stdout to clear the specified number of lines.
	 */
	public clearFooter() {
		for (let i = 0; i < this.lineCount + 3; i++) {
			process.stdout.write(`\n`);
		}
	}

	/**
	 * Sets the line count for console rewriting operations.
	 * 
	 * Used by log clients that rewrite console output (e.g., progress indicators).
	 * 
	 * @param lineCount - Number of lines to track for rewriting
	 */
	public rewriteConsole(lineCount: number) {
		this.lineCount = lineCount;
	}
}

/**
 * Singleton instance of the logging manager.
 * 
 * This is the central entry point for all logging. Logger instances call
 * `BeLogged.logImpl()` to output messages, which are then distributed to
 * all registered log clients.
 */
export const BeLogged = new BeLogged_Class();

