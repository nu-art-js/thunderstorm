/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {currentTimeMillis, generateHex, StringMap} from '@nu-art/ts-common';
import {
	DB_PermissionGroup,
	ModuleBE_PermissionAccessLevel,
	ModuleBE_PermissionApi,
	ModuleBE_PermissionDomain,
	ModuleBE_PermissionGroup,
	ModuleBE_PermissionProject,
	ModuleBE_PermissionUser,
	PermissionsAssert,
	User_Group
} from '../_main';
import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {cleanup} from './_core';
import {__custom, __scenario} from '@nu-art/testelot';
import {ApiException} from '@nu-art/thunderstorm/backend';


function makeAlphaBetIdForTestOnly(length: number) {
	let result = '';
	const characters = `abcdefghijklmnopqrstuvwxyz`;
	const charactersLength = characters.length;

	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export async function testUserPermissions(groupCustomFields: StringMap[], extraGroupCustomField: StringMap, requestCustomField: StringMap) {
	console.log('---￿Inside of permissions test---');
	const projectId = 'project-test-ten';
	const apiId = generateHex(32);
	const userId = generateHex(32);
	const apiPath = '/v1/test/test-it10';
	const userUuid = 'test10@intuitionrobotics.com';
	const permissionId = generateHex(32);
	const domainId = generateHex(32);
	const permissionValue = 50;
	await ModuleBE_PermissionProject.upsert({_id: projectId, name: 'project test'});
	await ModuleBE_PermissionDomain.upsert({_id: domainId, projectId: projectId, namespace: 'domain-test'});
	const accessLevel = await ModuleBE_PermissionAccessLevel.upsert({_id: permissionId, name: 'test-permission', domainId, value: permissionValue});
	await ModuleBE_PermissionApi.upsert({projectId: projectId, _id: apiId, path: apiPath, accessLevelIds: [permissionId]});

	const groupIdArray: User_Group[] = [];
	const dbInstances: DB_PermissionGroup[] = [];
	for (let counter = 0; counter < 11; counter++) {
		const groupId = generateHex(32);
		const baseAccessLevel = {domainId: accessLevel.domainId, value: accessLevel.value};
		dbInstances.push({
			_id: groupId,
			accessLevelIds: [accessLevel._id],
			__accessLevels: [baseAccessLevel],
			customFields: groupCustomFields,
			label: `group-${makeAlphaBetIdForTestOnly(5)}`
		});
		groupIdArray.push({groupId, customField: extraGroupCustomField});
	}

	console.log('Groups dbInstances ready to upsert');

	// @ts-ignore
	const collection = ModuleBE_PermissionGroup.collection;
	await collection.runInTransaction(async (transaction: FirestoreTransaction) => {

		// @ts-ignore
		await Promise.all(dbInstances.map(dbInstance => ModuleBE_PermissionGroup.assertUniqueness(transaction, dbInstance)));
		return transaction.upsertAll(collection, dbInstances);
	});

	console.log('Groups dbInstances upserted successfully');

	await ModuleBE_PermissionUser.upsert({_id: userId, accountId: userUuid, groups: groupIdArray});

	await runAssertion(projectId, apiPath, userUuid, requestCustomField);

}

async function runAssertion(projectId: string, apiPath: string, userUuid: string, customField: StringMap) {
	const start = currentTimeMillis();
	await PermissionsAssert.assertUserPermissions(projectId, apiPath, userUuid, customField);
	const runTime = currentTimeMillis() - start;
	console.log(`Call to assertion took ${runTime}ms`);
	return runTime;
}

export function testFullAssertUserPermissionsWithExtraGroupCFCovered() {
	const scenario = __scenario('Test full assert user permissions');
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq3', testOne: 'test-one', testTwo: 'test-two'};
		const groupCustomFields = [{UnitId: 'eq1', testOne: 'test-one'}];
		const extraGroupCustomField = {UnitId: 'eq[1-3]', testOne: 'test-one', testTwo: 'test-two'};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions passed successfully'));
	return scenario;
}

export function testFullAssertUserPermissionsWithEmptyUserCFsArrayAndEmptyRequestCFObj() {
	const scenario = __scenario('Test full assert user permissions');
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField: StringMap = {};
		const groupCustomFields: StringMap[] = [];
		const extraGroupCustomField = {UnitId: 'eq[1-3]', testOne: 'test-one', testTwo: 'test-two'};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with empty user CF\'s array and empty request CF Obj - passed successfully'));
	return scenario;
}

export function expectToFailTestFullAssertUserPermissionsWithNonGroupCFCovered() {
	const scenario = __scenario('Test full assert user permissions');
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq3', testOne: 'test-one', testTwo: 'test-two'};
		const groupCustomFields = [{UnitId: 'eq1', testOne: 'test-one'}];
		const extraGroupCustomField = {testOne: 'test-one', testTwo: 'test-two'};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with non group CF covered').expectToFail(ApiException));
	return scenario;
}

export function expectToFailTestFullAssertUserPermissionsWithNonGroupCFValueCovered() {
	const scenario = __scenario('Test full assert user permissions');
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq1', testOne: 'test-one', testTwo: 'test-two'};
		const groupCustomFields = [{UnitId: 'eq1', testOne: 'test-one'}];
		const extraGroupCustomField = {UnitId: 'eq4', testOne: 'test-one', testTwo: 'test-two'};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with non group CF value covered').expectToFail(ApiException));
	return scenario;
}

export function expectToFailTestFullAssertUserPermissionsWithNonGroupCFRegValueCovered() {
	const scenario = __scenario('Test full assert user permissions');
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq1', testOne: 'test-one', testTwo: 'test-two'};
		const groupCustomFields = [{UnitId: 'eq1', testOne: 'test-one'}];
		const extraGroupCustomField = {UnitId: 'eq[2-4]', testOne: 'test-one', testTwo: 'test-two'};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with non group CF regEx value covered').expectToFail(ApiException));
	return scenario;
}
