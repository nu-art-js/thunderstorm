/*
 * @nu-art/permissions-backend - Firebase tests for permission entity create/query
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {expect} from 'chai';
import {stormTester, StormTestInput} from '@nu-art/thunderstorm-backend/test/StormTest';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {
	permissionTestCleanup,
	setupProjectPermissions,
	Test_DefaultAccountId,
	Test_Domain1,
	Test_Setup2
} from './_core/consts.js';
import {DefaultStormTestConfig_Permissions} from './utils/helpers.js';
import {
	ModuleBE_PermissionAccessLevelDB,
	ModuleBE_PermissionAPIDB,
	ModuleBE_PermissionDomainDB,
	ModuleBE_PermissionGroupDB,
	ModuleBE_PermissionProjectDB
} from '../main/index.js';

type EntitiesSetup = Record<string, never>;
type TestCase_Entities = TestModel<EntitiesSetup, boolean>;

const test = async (_input: EntitiesSetup): Promise<boolean> => {
	await permissionTestCleanup();
	const setupResult = await setupProjectPermissions(Test_Setup2.projects);

	const project = setupResult.nameToProjectMap['test-project'];
	const domain = setupResult.domainNameToObjectMap[Test_Domain1];
	const readGroup = setupResult.nameToGroupMap['test-group-read'];

	const dbProject = await ModuleBE_PermissionProjectDB.query.uniqueAssert(project._id);
	expect(dbProject._id).to.eql(project._id);
	expect(dbProject.name).to.eql('test-project');

	const dbDomain = await ModuleBE_PermissionDomainDB.query.uniqueAssert(domain._id);
	expect(dbDomain.namespace).to.eql(Test_Domain1);
	expect(dbDomain.projectId).to.eql(project._id);

	const dbLevels = await ModuleBE_PermissionAccessLevelDB.query.custom({where: {domainId: domain._id}});
	expect(dbLevels.length).to.be.greaterThan(0);

	const dbGroup = await ModuleBE_PermissionGroupDB.query.uniqueAssert(readGroup!._id);
	expect(dbGroup.label).to.eql('test-group-read');
	expect(dbGroup.accessLevelIds).to.be.an('array');

	const apis = await ModuleBE_PermissionAPIDB.query.custom({where: {projectId: project._id}});
	expect(apis.length).to.eql(1);
	expect(apis[0].path).to.eql('v1/stam');

	return true;
};

const runTestCase = (testCase: TestCase_Entities) => async () =>
	await new MemStorage().init(async () => {
		MemKey_AccountId.set(Test_DefaultAccountId);
		await runSingleTestCase(test, testCase);
	});

const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_Permissions
};

describe('Permissions - Entity create and query', () => {
	it('Setup then query project, domain, levels, group, API', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Query entities after setup',
			input: {},
			result: true
		}));
	});
});
