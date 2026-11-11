/*
 * @nu-art/action-processor-frontend - Dev Tools view model tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {
	actionTitle,
	confirmReady,
	errorText,
	filterDevToolsActions,
	groupDevToolsActions,
	runEnabled,
	type DevToolsAction,
} from '../main/ATS_ActionProcessor/dev-tools-model.js';

const setup: DevToolsAction = {
	key: 'setup-project',
	label: 'Setup project',
	group: 'Initialization',
	description: 'Run the project setup graph from the configured roots.',
	destructive: true,
};

const restamp: DevToolsAction = {
	key: 'knowledge-access-restamp',
	label: 'Knowledge access restamp',
	group: 'Knowledge',
	description: 'Restamp every existing knowledge node.',
	destructive: true,
};

const read: DevToolsAction = {
	key: 'read-diagnostics',
	label: 'Read diagnostics',
	group: 'Diagnostics',
	description: 'Read the current diagnostics.',
	destructive: false,
};

type Input = {name: string};
type Result = {ok: true};
type TestCase_DevTools = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => {
	if (input.name === 'title uses the label') {
		expect(actionTitle(setup)).to.equal('Setup project');
		expect(actionTitle({key: 'bare-key', description: '', group: 'Other'})).to.equal('bare-key');
	}

	if (input.name === 'search keeps a title, key, or description match') {
		const actions = [setup, restamp, read];
		expect(filterDevToolsActions(actions, 'restamp', false).map(action => action.key)).to.deep.equal(['knowledge-access-restamp']);
		expect(filterDevToolsActions(actions, 'diagnostics', false).map(action => action.key)).to.deep.equal(['read-diagnostics']);
		expect(filterDevToolsActions(actions, 'SETUP-PROJECT', false).map(action => action.key)).to.deep.equal(['setup-project']);
	}

	if (input.name === 'destructive filter drops safe actions') {
		const visible = filterDevToolsActions([setup, read], '', true);
		expect(visible.map(action => action.key)).to.deep.equal(['setup-project']);
	}

	if (input.name === 'groups keep arrival order and counts') {
		const groups = groupDevToolsActions([setup, read, restamp]);
		expect(groups.map(group => [group.name, group.items.length])).to.deep.equal([
			['Initialization', 1],
			['Diagnostics', 1],
			['Knowledge', 1],
		]);
	}

	if (input.name === 'a destructive action runs only after the title is typed') {
		expect(confirmReady(setup, 'setup')).to.equal(false);
		expect(confirmReady(setup, 'Setup project')).to.equal(true);
		expect(confirmReady(read, '')).to.equal(true);
		expect(runEnabled({canRun: true, running: false, action: setup, confirm: 'Setup project'})).to.equal(true);
		expect(runEnabled({canRun: false, running: false, action: setup, confirm: 'Setup project'})).to.equal(false);
		expect(runEnabled({canRun: true, running: true, action: read, confirm: ''})).to.equal(false);
		expect(runEnabled({canRun: true, running: false, action: undefined, confirm: ''})).to.equal(false);
	}

	if (input.name === 'error text keeps a message and falls back otherwise') {
		expect(errorText(new Error('denied'), 'The action list failed.')).to.equal('denied');
		expect(errorText('  offline  ', 'The action list failed.')).to.equal('offline');
		expect(errorText({code: 500}, 'The action list failed.')).to.equal('The action list failed.');
	}

	return {ok: true};
};

const runTestCase = (testCase: TestCase_DevTools) => () => runSingleTestCase(test, testCase);

describe('Dev Tools view model', () => {
	it('title uses the label', runTestCase({input: {name: 'title uses the label'}, result: {ok: true}}));
	it('search keeps a title, key, or description match', runTestCase({input: {name: 'search keeps a title, key, or description match'}, result: {ok: true}}));
	it('destructive filter drops safe actions', runTestCase({input: {name: 'destructive filter drops safe actions'}, result: {ok: true}}));
	it('groups keep arrival order and counts', runTestCase({input: {name: 'groups keep arrival order and counts'}, result: {ok: true}}));
	it('a destructive action runs only after the title is typed', runTestCase({input: {name: 'a destructive action runs only after the title is typed'}, result: {ok: true}}));
	it('error text keeps a message and falls back otherwise', runTestCase({input: {name: 'error text keeps a message and falls back otherwise'}, result: {ok: true}}));
});
