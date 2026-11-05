/*
 * @nu-art/build-and-install - Build, test, and deploy a Thunderstorm monorepo
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {cloudSchedulerCron, invokerIamDisabled} from '../../main/units/implementations/firebase/cloud-scheduler.js';

type Input_Invoker = { trigger: string };
type Result_Invoker = 'true' | 'false';
type TestCase_Invoker = TestModel<Input_Invoker, Result_Invoker>;

const test_Invoker = async (input: Input_Invoker): Promise<Result_Invoker> => invokerIamDisabled(input.trigger);
const runTestCase_Invoker = (testCase: TestCase_Invoker) => () => runSingleTestCase(test_Invoker, testCase);

type Input_Cron = { schedule: string };
type Result_Cron = string;
type TestCase_Cron = TestModel<Input_Cron, Result_Cron>;

const test_Cron = async (input: Input_Cron): Promise<Result_Cron> => cloudSchedulerCron(input.schedule);
const runTestCase_Cron = (testCase: TestCase_Cron) => () => runSingleTestCase(test_Cron, testCase);

describe('Cloud Scheduler for a container function', () => {
	it('keeps a scheduled function private', runTestCase_Invoker({
		input: {trigger: 'schedule'},
		result: 'false',
	}));

	it('leaves an http function public', runTestCase_Invoker({
		input: {trigger: 'http'},
		result: 'true',
	}));

	it('leaves an eventarc function public', runTestCase_Invoker({
		input: {trigger: 'eventarc'},
		result: 'true',
	}));

	it('turns every 24 hours into midnight', runTestCase_Cron({
		input: {schedule: 'every 24 hours'},
		result: '0 0 * * *',
	}));

	it('turns every 6 hours into a step cron', runTestCase_Cron({
		input: {schedule: 'every 6 hours'},
		result: '0 */6 * * *',
	}));

	it('turns every 15 minutes into a step cron', runTestCase_Cron({
		input: {schedule: 'every 15 minutes'},
		result: '*/15 * * * *',
	}));

	it('keeps a cron that is already 5 fields', runTestCase_Cron({
		input: {schedule: '0 2 * * *'},
		result: '0 2 * * *',
	}));

	it('rejects a schedule Cloud Scheduler cannot run', runTestCase_Cron({
		input: {schedule: 'every day'},
		error: {expected: 'not a 5-field cron'},
	}));
});
