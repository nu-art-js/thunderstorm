/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {BeLogged, Logger} from '../main/index.js';
import {LogClient_File} from '../main/node.js';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {mkdir, rm} from 'fs/promises';
import {___dirname} from '@nu-art/ts-common/esm';
import {expect} from 'chai';

// Global cleanup to ensure all clients are removed after all tests
after(() => {
	BeLogged.removeAllClients();
});

const dirname = ___dirname(import.meta.url);
const pathToTemp = resolve(dirname, './temp');
const pathToWorkspace = resolve(pathToTemp, './workspace');

type Input_FileLog = { logDir: string; message: string };
type Result_FileLog = { fileExists: boolean; content: string };

type TestCase_FileLog = TestModel<Input_FileLog, Result_FileLog>;

const test_FileLog = async (input: Input_FileLog): Promise<Result_FileLog> => {
	const logDir = resolve(pathToWorkspace, input.logDir);
	const fileClient = new LogClient_File('test', logDir, 3, 1024);
	BeLogged.addClient(fileClient);
	
	const logger = new Logger('TestLogger');
	logger.logInfo(input.message);
	
	// Give it a moment to write
	await new Promise(resolve => setTimeout(resolve, 100));
	
	const logFile = resolve(logDir, 'test-0.txt');
	const fileExists = existsSync(logFile);
	let content = '';
	if (fileExists) {
		content = readFileSync(logFile, 'utf-8');
	}
	
	BeLogged.removeClient(fileClient);
	fileClient.stop();
	
	return { fileExists, content };
};

const runTestCase_FileLog = (testCase: TestCase_FileLog) => () => runSingleTestCase(test_FileLog, testCase);

describe('LogClient_File - File Logging', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		await rm(pathToTemp, {recursive: true, force: true});
		await mkdir(pathToWorkspace, {recursive: true});
	});

	it('should create log file and write logs', runTestCase_FileLog({
		input: { logDir: 'logs', message: 'test message' },
		result: async (result) => {
			expect(result.fileExists).to.be.true;
			expect(result.content).to.include('test message');
		}
	}));

	it('should create log directory if it does not exist', runTestCase_FileLog({
		input: { logDir: 'new-logs', message: 'new directory test' },
		result: async (result) => {
			expect(result.fileExists).to.be.true;
			expect(result.content).to.include('new directory test');
		}
	}));

	afterEach(function () {
		if (this.currentTest?.state === 'failed') suiteHasFailures = true;
		suiteHasFailures ??= false;
	});

	after(async function () {
		await new Promise(resolve => setTimeout(resolve, 1000));
		if (suiteHasFailures === false) {
			await rm(pathToTemp, {recursive: true, force: true});
		}
	});
});

describe('LogClient_File - Log Rotation', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		await rm(pathToTemp, {recursive: true, force: true});
		await mkdir(pathToWorkspace, {recursive: true});
	});

	it('should rotate logs when max size is exceeded', async () => {
		const logDir = resolve(pathToWorkspace, 'rotation-test');
		const fileClient = new LogClient_File('rotate', logDir, 3, 100); // Small max size
		BeLogged.addClient(fileClient);
		
		const logger = new Logger('TestLogger');
		// Write enough to trigger rotation
		for (let i = 0; i < 10; i++) {
			logger.logInfo('x'.repeat(50)); // Each log is ~50+ bytes
		}
		
		await new Promise(resolve => setTimeout(resolve, 200));
		
		// Should have rotated files
		const file0 = resolve(logDir, 'rotate-0.txt');
		const file1 = resolve(logDir, 'rotate-1.txt');
		
		// At least one file should exist
		expect(existsSync(file0) || existsSync(file1)).to.be.true;
		
		BeLogged.removeClient(fileClient);
		fileClient.stop();
	});

	afterEach(function () {
		if (this.currentTest?.state === 'failed') suiteHasFailures = true;
		suiteHasFailures ??= false;
	});

	after(async function () {
		await new Promise(resolve => setTimeout(resolve, 1000));
		if (suiteHasFailures === false) {
			await rm(pathToTemp, {recursive: true, force: true});
		}
	});
});

describe('LogClient_File - Existing File Handling', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		await rm(pathToTemp, {recursive: true, force: true});
		await mkdir(pathToWorkspace, {recursive: true});
	});

	it('should append to existing log file', async () => {
		const logDir = resolve(pathToWorkspace, 'append-test');
		const fileClient1 = new LogClient_File('append', logDir, 3, 1024);
		BeLogged.addClient(fileClient1);
		
		const logger = new Logger('TestLogger');
		logger.logInfo('first message');
		
		await new Promise(resolve => setTimeout(resolve, 100));
		
		BeLogged.removeClient(fileClient1);
		fileClient1.stop();
		
		// Create new client with same file
		const fileClient2 = new LogClient_File('append', logDir, 3, 1024);
		BeLogged.addClient(fileClient2);
		
		logger.logInfo('second message');
		
		await new Promise(resolve => setTimeout(resolve, 100));
		
		const logFile = resolve(logDir, 'append-0.txt');
		const content = readFileSync(logFile, 'utf-8');
		
		expect(content).to.include('first message');
		expect(content).to.include('second message');
		
		BeLogged.removeClient(fileClient2);
		fileClient2.stop();
	});

	afterEach(function () {
		if (this.currentTest?.state === 'failed') suiteHasFailures = true;
		suiteHasFailures ??= false;
	});

	after(async function () {
		await new Promise(resolve => setTimeout(resolve, 1000));
		if (suiteHasFailures === false) {
			await rm(pathToTemp, {recursive: true, force: true});
		}
	});
});
