/*
 * commando provides shell command execution framework with interactive sessions and plugin system
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

import {BaseCommando} from '../core/BaseCommando.js';
import {MergeClass} from '../core/class-merger.js';
import {Commando_Basic} from './basic.js';
import {Commando_Programming} from './programming.js';
import {Commando_NVM} from './nvm.js';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic, Commando_NVM);

/**
 * PNPM package manager plugin for Commando.
 * 
 * Provides PNPM operations:
 * - Install PNPM
 * - Get PNPM version
 * - Install packages (with store prune and force flags)
 * 
 * Extends Commando_NVM, Commando_Programming, and Commando_Basic (merged).
 * Requires NVM for Node.js version management.
 */
export class Commando_PNPM
	extends Super {

	/**
	 * Installs packages using PNPM.
	 * 
	 * Prunes the store, then installs with force flag and no frozen lockfile.
	 * 
	 * @returns This instance for method chaining
	 */
	async installPackages() {
		await this
			.append(`pnpm store prune`)
			.append(`pnpm install -f --no-frozen-lockfile --prefer-offline false`)
			.execute();

		return this;
	}

	/**
	 * Installs PNPM by downloading and executing the install script.
	 * 
	 * @param version - PNPM version to install
	 * @returns This instance for method chaining
	 */
	async install(version: string) {
		await this
			.append(`curl -fsSL "https://get.pnpm.io/install.sh" | env PNPM_VERSION=${version} bash -`)
			.execute();

		return this;
	}

	/**
	 * Gets the installed PNPM version.
	 * 
	 * Only executes if PNPM is available (checks with `command -v pnpm`).
	 * 
	 * @returns Promise resolving to PNPM version string (trimmed)
	 */
	async getVersion() {
		return this.if('[[ -x "$(command -v pnpm)" ]]', (commando) => {
			commando.append('pnpm --version');
		}).execute(stdout => stdout.trim());
	}

}