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
	__stringify,
	BadImplementationException,
	ImplementationMissingException,
	Module
} from "@nu-art/ts-common";
import {FirebaseConfig} from "..";
import {FirebaseSession} from "./auth/FirebaseSession";

const localSessionId = 'local';

type ConfigType = {
	[s: string]: FirebaseConfig;
};

export class FirebaseModule_Class
	extends Module<ConfigType> {

	private sessions: { [projectId: string]: FirebaseSession } = {};

	constructor() {
		super("firebase");
	}

	private async createLocalSession(): Promise<FirebaseSession> {
		let session = this.sessions[localSessionId];
		if (session)
			return session;

		const localConfig = this.getProjectAuth('local');
		if (!localConfig)
			await this.fetchLocalConfig();

		return this.createSession(localSessionId);
	}

	private fetchLocalConfig = async () => {
		try {
			const resp = await fetch('/__/firebase/init.json');
			const config = await resp.json() as Promise<FirebaseConfig>;
			// @ts-ignore
			this.setConfig({[localSessionId]: config});
		} catch (e) {
			throw new ImplementationMissingException(`Either specify configs for the 'FirebaseModule' or use SDK auto-configuration with firebase hosting`)
		}
	};

	public async createSession(projectId?: string | FirebaseConfig, token?: string) {
		if (!projectId)
			return this.createLocalSession();

		if (typeof projectId === "object")
			return this.createSessionWithConfigs(projectId);

		let session = this.sessions[projectId];
		if (session)
			return session;

		this.logInfo(`Creating session for config: ${projectId}`);
		let config = this.getProjectAuth(projectId);
		if (!config)
			throw new BadImplementationException('Did you forget to add FirebaseModule to the main.ts in the modules array?');

		if (!config || !config.projectId || !config.apiKey || !config.authDomain)
			throw new BadImplementationException(`Config for key ${projectId} is not an Admin credentials pattern`);

		return this.initiateSession(projectId,config,token);
	}

	private async createSessionWithConfigs(config: FirebaseConfig): Promise<FirebaseSession> {
		if (!config || !config.projectId || !config.databaseURL || !config.authDomain || !config.apiKey)
			throw new BadImplementationException(`Config: ${__stringify(config)} is not a credentials pattern`);

		// @ts-ignore
		this.setConfig({[config.projectId]: config});

		return this.createSession(config.projectId);
	}

	private getProjectAuth(projectId: string) {
		return this.config?.[projectId];
	}

	private async initiateSession(projectId: string, config: FirebaseConfig, token?: string) {
		const session = new FirebaseSession(projectId, config);
		this.sessions[projectId] = session;

		session.connect();

		if (token)
			await session.signInWithToken(token);

		return session;
	}
}

export const FirebaseModule = new FirebaseModule_Class();