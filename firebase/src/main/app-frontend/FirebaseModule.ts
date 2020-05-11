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

/**
 * Created by tacb0ss on 25/08/2018.
 */

import {
	BadImplementationException,
	ImplementationMissingException,
	Module
} from "@nu-art/ts-common";
import {FirebaseConfig} from "..";
import {LocalSession} from "./auth/LocalSession";
import {TokenSession} from "./auth/TokenSession";

type ConfigType = {
	[s: string]: FirebaseConfig;
};

export class FirebaseModule_Class
	extends Module<ConfigType> {

	// private readonly sessions: { [s: string]: FirebaseSession; } = {};
	private sessions: { [projectId: string]: TokenSession } = {};
	private local!: LocalSession;

	constructor() {
		super("firebase");
	}

	async createLocalSession(): Promise<LocalSession> {
		if (this.local)
			return this.local;

		const config = await this.getLocalConfig();

		this.local = new LocalSession("local-session", config);
		this.local.connect();

		return this.local;
	}

	private getLocalConfig = async (): Promise<FirebaseConfig> => {
		const localConfig = this.getProjectAuth('local');
		if (localConfig)
			return localConfig;

		try {
			const resp = await fetch('/__/firebase/init.json');
			return await resp.json() as Promise<FirebaseConfig>;
		} catch (e) {
			throw new ImplementationMissingException(`Either specify configs for the 'PushPubSubModule' or use SDK auto-configuration with firebase hosting`)
		}
	};

	public async createSession(projectId: string) {
		let session = this.sessions[projectId];
		if (session)
			return session;

		this.logInfo(`Creating session for config: ${projectId}`);
		let config = this.getProjectAuth(projectId);
		if (!config)
			throw new BadImplementationException('Did you forget to add FirebaseModule to the main.ts in the modules array?');

		if (!config || !config.projectId || !config.apiKey || !config.authDomain)
			throw new BadImplementationException(`Config for key ${projectId} is not an Admin credentials pattern`);

		session = new TokenSession(projectId, config);
		this.sessions[projectId] = session;

		session.connect();
		return session;
	}

	private getProjectAuth(projectId: string) {
		return this.config?.[projectId];
	}

}

export const FirebaseModule = new FirebaseModule_Class();