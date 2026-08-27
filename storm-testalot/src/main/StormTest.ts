/*
 * @nu-art/storm-testalot - Storm-aware test harness
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AsyncVoidFunction, generateHex, Module, ModuleManager, RecursiveObjectOfPrimitives} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {FIREBASE_DEFAULT_PROJECT_ID, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {Storm} from '@nu-art/storm-core';
import {ModuleBE_Auth} from '@nu-art/google-services-backend';
import {TestModel} from '@nu-art/testalot';

export type StormTestConfig = {
	databaseName?: string;
	modules: Module[];
	config: RecursiveObjectOfPrimitives;
};

export type StormTestInput = {
	modules: Module[];
	config?: RecursiveObjectOfPrimitives;
	cleanup?: AsyncVoidFunction;
	before?: AsyncVoidFunction;
	after?: AsyncVoidFunction;
};

export class StormTest {
	private firebaseConfig;
	private testConfig;

	constructor(config: StormTestConfig) {
		this.testConfig = config;
		const database = config.databaseName ?? `demo-test`;
		this.firebaseConfig = {
			project_id: generateHex(4),
			databaseURL: `http://localhost:8102/?ns=${database}`,
			isEmulator: true
		};
		process.env.FUNCTIONS_EMULATOR = 'true';
		process.env.GCLOUD_PROJECT = database;
		ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: this.firebaseConfig}});
	}

	async init() {
		new Storm({envKey: 'local', pathToDefaultConfig: '_config/default', pathToEnvOverrideConfig: '_config/test'})
			.addModulePack(this.testConfig.modules)
			.setConfig({...this.testConfig.config, isDebug: true})
			.init();
		return this;
	}

	async cleanup() {
		await ModuleBE_Firebase.__resetForTests();
		await ModuleManager.destroy();
	}
}

export const stormTester = async <TestCase extends TestModel<any, any>>(stormTestInput: StormTestInput, testCaseRunner: () => Promise<void>) => {
	const stormTest = new StormTest({modules: stormTestInput.modules, config: stormTestInput.config ?? {}});
	await stormTest.init();
	await new MemStorage().init(async () => {
		try {
			await stormTestInput.before?.();
			await testCaseRunner();
		} finally {
			try {
				await stormTestInput.after?.();
			} finally {
				await stormTest.cleanup();
			}
		}
	});
};
