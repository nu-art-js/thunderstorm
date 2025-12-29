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

import {ModuleManager} from "./module-manager.js";

/**
 * Application class that extends ModuleManager with startup callback support.
 * 
 * Provides a convenient way to execute code after all modules have been initialized.
 * The `onStarted` callback is executed asynchronously and errors are caught and logged
 * but don't prevent the application from continuing.
 * 
 * @example
 * ```typescript
 * const app = new Application();
 * app.addModulePack([ModuleA, ModuleB]);
 * app.setConfig({ ... });
 * app.build(async () => {
 *   // This runs after all modules are initialized
 *   await startServer();
 * });
 * ```
 */
export class Application
	extends ModuleManager {

	constructor() {
		super();
	}

	/**
	 * Initializes all modules and optionally executes a startup callback.
	 * 
	 * The callback is executed asynchronously (fire-and-forget). If the callback
	 * returns data, it will be logged. Errors in the callback are caught and logged
	 * but don't affect the application state.
	 * 
	 * @param onStarted - Optional async callback to execute after initialization.
	 *                    The callback's return value (if any) will be logged.
	 */
	build(onStarted?: () => Promise<any>) {
		super.build();
		onStarted && onStarted()
			.then((data) => {
				data && this.logInfo("data: ", data);
				this.logInfo("Completed");
			})
			.catch((err) => this.logError("Error", err));
	}
}
