/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TestSuite} from '@nu-art/ts-common/testing/types.js';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts.js';
import {LogClient, LogLevel, LogPrefixComposer, BeLogged, LogClient_MemBuffer} from '../main/index.js';
import {createTestBuffer, getBufferContent} from './helpers.js';
import {expect} from 'chai';

// Create a testable LogClient implementation
class TestLogClient extends LogClient {
	public loggedMessages: Array<{ level: LogLevel; bold: boolean; prefix: string; toLog: any[] }> = [];
	public initialized = false;
	public stopped = false;

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, ...toLog: any[]): void {
		this.loggedMessages.push({ level, bold, prefix, toLog });
	}

	init() {
		super.init();
		this.initialized = true;
	}

	stop() {
		super.stop();
		this.stopped = true;
	}
}

type Input_PrefixComposer = { composer: LogPrefixComposer; tag: string; level: LogLevel };
type Result_PrefixComposer = { prefix: string };

type TestSuite_PrefixComposer = TestSuite<Input_PrefixComposer, Result_PrefixComposer>;
type TestCase_PrefixComposer = TestSuite_PrefixComposer['testcases'][number];

const test_PrefixComposer = async (input: Input_PrefixComposer): Promise<Result_PrefixComposer> => {
	const client = new TestLogClient();
	client.setComposer(input.composer);
	client.log(input.tag, input.level, false, ['test']);
	
	const prefix = client.loggedMessages[0].prefix;
	return { prefix };
};

const runTestCase_PrefixComposer = (testCase: TestCase_PrefixComposer) => () => runSingleTestCase(test_PrefixComposer, testCase);

describe('LogClient - Prefix Composer', () => {
	it('should use default prefix composer', runTestCase_PrefixComposer({
		input: {
			composer: (tag, level) => `[${level}] ${tag}: `,
			tag: 'TestTag',
			level: LogLevel.Info
		},
		result: { prefix: '[Info] TestTag: ' }
	}));

	it('should allow custom prefix composer', runTestCase_PrefixComposer({
		input: {
			composer: (tag, level) => `CUSTOM: ${tag} [${level}] `,
			tag: 'CustomTag',
			level: LogLevel.Debug
		},
		result: { prefix: 'CUSTOM: CustomTag [Debug] ' }
	}));
});

type Input_ClientFilter = { filter: (level: LogLevel, tag: string) => boolean; level: LogLevel; tag: string };
type Result_ClientFilter = { logged: boolean };

type TestSuite_ClientFilter = TestSuite<Input_ClientFilter, Result_ClientFilter>;
type TestCase_ClientFilter = TestSuite_ClientFilter['testcases'][number];

const test_ClientFilter = async (input: Input_ClientFilter): Promise<Result_ClientFilter> => {
	const client = new TestLogClient();
	client.setFilter(input.filter);
	client.log(input.tag, input.level, false, ['test']);
	
	const logged = client.loggedMessages.length > 0;
	return { logged };
};

const runTestCase_ClientFilter = (testCase: TestCase_ClientFilter) => () => runSingleTestCase(test_ClientFilter, testCase);

describe('LogClient - Filtering', () => {
	it('should log when filter returns true', runTestCase_ClientFilter({
		input: {
			filter: () => true,
			level: LogLevel.Info,
			tag: 'TestTag'
		},
		result: { logged: true }
	}));

	it('should not log when filter returns false', runTestCase_ClientFilter({
		input: {
			filter: () => false,
			level: LogLevel.Info,
			tag: 'TestTag'
		},
		result: { logged: false }
	}));

	it('should filter by level', runTestCase_ClientFilter({
		input: {
			filter: (level) => level === LogLevel.Error,
			level: LogLevel.Info,
			tag: 'TestTag'
		},
		result: { logged: false }
	}));

	it('should filter by tag', runTestCase_ClientFilter({
		input: {
			filter: (level, tag) => tag === 'AllowedTag',
			level: LogLevel.Info,
			tag: 'BlockedTag'
		},
		result: { logged: false }
	}));
});

describe('LogClient - Lifecycle', () => {
	it('should call init when added to BeLogged', () => {
		const client = new TestLogClient();
		expect(client.initialized).to.be.false;
		BeLogged.addClient(client);
		expect(client.initialized).to.be.true;
		BeLogged.removeClient(client);
	});

	it('should call stop when removed from BeLogged', () => {
		const client = new TestLogClient();
		BeLogged.addClient(client);
		expect(client.stopped).to.be.false;
		BeLogged.removeClient(client);
		expect(client.stopped).to.be.true;
	});
});

describe('LogClient - Log Method', () => {
	it('should pass correct parameters to logMessage', () => {
		const client = new TestLogClient();
		client.setComposer((tag, level) => `[${level}] ${tag}: `);
		client.log('TestTag', LogLevel.Warning, true, ['message1', 'message2']);
		
		expect(client.loggedMessages).to.have.length(1);
		expect(client.loggedMessages[0].level).to.equal(LogLevel.Warning);
		expect(client.loggedMessages[0].bold).to.be.true;
		expect(client.loggedMessages[0].prefix).to.equal('[Warning] TestTag: ');
		expect(client.loggedMessages[0].toLog).to.deep.equal(['message1', 'message2']);
	});

	it('should not call logMessage when filtered', () => {
		const client = new TestLogClient();
		client.setFilter(() => false);
		client.log('TestTag', LogLevel.Info, false, ['message']);
		
		expect(client.loggedMessages).to.have.length(0);
	});
});
