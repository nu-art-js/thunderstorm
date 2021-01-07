/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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
import {
	currentTimeMillies,
	generateHex,
	StringMap
} from "@intuitionrobotics/ts-common";
import {
	ProjectPermissionsDB,
	DomainPermissionsDB,
	AccessLevelPermissionsDB,
	ApiPermissionsDB,
	User_Group,
	DB_PermissionsGroup,
    UserPermissionsDB,
    PermissionsAssert,
    GroupPermissionsDB
} from "../_main";
import { FirestoreTransaction } from "@intuitionrobotics/firebase/backend";
import { cleanup } from "./_core";
import {
	__custom,
	__scenario
} from "@intuitionrobotics/testelot";
import { ApiException } from "@intuitionrobotics/thunderstorm/backend";

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
	console.log("---￿Inside of permissions test---");
	const projectId = 'project-test-ten';
	const apiId = generateHex(32);
	const userId = generateHex(32);
	const apiPath = '/v1/test/test-it10';
	const userUuid = 'test10@intuitionrobotics.com';
	const permissionId = generateHex(32);
	const domainId = generateHex(32);
	const permissionValue = 50;
	await ProjectPermissionsDB.upsert({_id: projectId, name: 'project test'});
	await DomainPermissionsDB.upsert({_id: domainId, projectId: projectId, namespace: 'domain-test'});
	const accessLevel = await AccessLevelPermissionsDB.upsert({_id: permissionId, name: 'test-permission', domainId, value: permissionValue});
	await ApiPermissionsDB.upsert({projectId: projectId, _id: apiId, path: apiPath, accessLevelIds: [permissionId]});

	const groupIdArray: User_Group[] = [];
	const dbInstances: DB_PermissionsGroup[] = [];
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
	const collection = GroupPermissionsDB.collection;
	await collection.runInTransaction(async (transaction: FirestoreTransaction) => {

		// @ts-ignore
		await Promise.all(dbInstances.map(dbInstance => GroupPermissionsDB.assertUniqueness(transaction, dbInstance)));
		return transaction.upsertAll(collection, dbInstances);
	});

	console.log('Groups dbInstances upserted successfully');

	await UserPermissionsDB.upsert({_id: userId, accountId: userUuid, groups: groupIdArray});

	await runAssertion(projectId, apiPath, userUuid, requestCustomField);

}

async function runAssertion(projectId: string, apiPath: string, userUuid: string, customField: StringMap) {
	const start = currentTimeMillies();
	await PermissionsAssert.assertUserPermissions(projectId, apiPath, userUuid, customField);
	const runTime = currentTimeMillies() - start;
	console.log(`Call to assertion took ${runTime}ms`);
	return runTime;
}

export function testFullAssertUserPermissionsWithExtraGroupCFCovered() {
	const scenario = __scenario("Test full assert user permissions");
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq3', testOne: "test-one", testTwo: "test-two"};
		const groupCustomFields = [{UnitId: 'eq1', testOne: "test-one"}];
		const extraGroupCustomField = {UnitId: 'eq[1-3]', testOne: "test-one", testTwo: "test-two"};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions passed successfully'));
	return scenario;
}

export function testFullAssertUserPermissionsWithEmptyUserCFsArrayAndEmptyRequestCFObj() {
	const scenario = __scenario("Test full assert user permissions");
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField: StringMap = {};
		const groupCustomFields: StringMap[] = [];
		const extraGroupCustomField = {UnitId: 'eq[1-3]', testOne: "test-one", testTwo: "test-two"};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel("Test full assert user permissions with empty user CF's array and empty request CF Obj - passed successfully"));
	return scenario;
}

export function expectToFailTestFullAssertUserPermissionsWithNonGroupCFCovered() {
	const scenario = __scenario("Test full assert user permissions");
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq3', testOne: "test-one", testTwo: "test-two"};
		const groupCustomFields = [{UnitId: 'eq1', testOne: "test-one"}];
		const extraGroupCustomField = {testOne: "test-one", testTwo: "test-two"};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with non group CF covered').expectToFail(ApiException));
	return scenario;
}

export function expectToFailTestFullAssertUserPermissionsWithNonGroupCFValueCovered() {
	const scenario = __scenario("Test full assert user permissions");
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq1', testOne: "test-one", testTwo: "test-two"};
		const groupCustomFields = [{UnitId: 'eq1', testOne: "test-one"}];
		const extraGroupCustomField = {UnitId: 'eq4', testOne: "test-one", testTwo: "test-two"};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with non group CF value covered').expectToFail(ApiException));
	return scenario;
}

export function expectToFailTestFullAssertUserPermissionsWithNonGroupCFRegValueCovered() {
	const scenario = __scenario("Test full assert user permissions");
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const requestCustomField = {UnitId: 'eq1', testOne: "test-one", testTwo: "test-two"};
		const groupCustomFields = [{UnitId: 'eq1', testOne: "test-one"}];
		const extraGroupCustomField = {UnitId: 'eq[2-4]', testOne: "test-one", testTwo: "test-two"};
		await testUserPermissions(groupCustomFields, extraGroupCustomField, requestCustomField);
	}).setLabel('Test full assert user permissions with non group CF regEx value covered').expectToFail(ApiException));
	return scenario;
}
