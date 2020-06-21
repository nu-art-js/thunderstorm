/*
 * ts-common is the basic building blocks of our typescript projects
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

import {
	generateHex,
	currentTimeMillies
} from "@nu-art/ts-common";
import {
	AccessLevelPermissionsDB,
	ApiPermissionsDB,
	DomainPermissionsDB,
	ProjectPermissionsDB
} from "../modules/db-types/managment";
import {
	GroupPermissionsDB,
	UserPermissionsDB
} from "../modules/db-types/assign";
import {PermissionsAssert} from "../modules/permissions-assert";
import {DB_PermissionsGroup} from "../..";
import {FirestoreTransaction} from "@nu-art/firebase/backend";

function makeAlphaBetIdForTestOnly(length: number) {
	let result = '';
	const characters = `abcdefghijklmnopqrstuvwxyz`;
	const charactersLength = characters.length;

	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export async function testUserPermissionsTime() {
	console.log("---￿Inside of permissions test---");
	const projectId = 'project-test-ten';
	const apiId = generateHex(32);
	const userId = generateHex(32);
	const apiPath = '/v1/test/test-it10';
	const userUuid = 'test10@intuitionrobotics.com';
	const permissionId = generateHex(32);
	const domainId = generateHex(32);
	const permissionValue = 50;
	const customField = {UnitId: 'eq1'};
	await ProjectPermissionsDB.upsert({_id: projectId, name: 'project test'});
	await DomainPermissionsDB.upsert({_id: domainId, projectId: projectId, namespace: 'domain-test'});
	const accessLevel = await AccessLevelPermissionsDB.upsert({_id: permissionId, name: 'test-permission', domainId, value: permissionValue});
	await ApiPermissionsDB.upsert({projectId: projectId, _id: apiId, path: apiPath, accessLevelIds: [permissionId]});

	const groupIdArray = [];
	const dbInstances: DB_PermissionsGroup[] = [];
	for (let counter = 0; counter < 100; counter++) {
		const groupId = generateHex(32);
		const baseAccessLevel = {domainId: accessLevel.domainId, value: accessLevel.value};
		dbInstances.push({
			                 _id: groupId,
			                 accessLevelIds: [accessLevel._id],
			                 __accessLevels: [baseAccessLevel],
			                 customFields: [customField],
			                 label: `group-${makeAlphaBetIdForTestOnly(5)}`
		                 });
		groupIdArray.push({groupId});
	}

	console.log('dbInstances ready to upsert');

	// @ts-ignore
	const collection = GroupPermissionsDB.collection;
	await collection.runInTransaction(async (transaction: FirestoreTransaction) => {

		// @ts-ignore
		await Promise.all(dbInstances.map(dbInstance => GroupPermissionsDB.assertUniqueness(transaction, dbInstance)));
		return transaction.upsertAll(collection, dbInstances);
	});

	await UserPermissionsDB.upsert({_id: userId, userId: userUuid, groups: groupIdArray});

	const tests = new Array<number>().fill(0, 0, 50);
	const durations: number[] = await Promise.all(tests.map(test => runAssertion(projectId, apiPath, userUuid, customField)));
	const sum = durations.reduce((_sum, val) => _sum + val, 0);
	console.log(`Call to assertion on ${tests.length} call took on agerage ${sum / tests.length}ms`);


	// ----deletes db documents---
	await UserPermissionsDB.delete({where: {_id: userId}});
	for (let counter = 0; counter < 10; counter++) {
		const startIndex = counter * 10;
		const subDbInstances = dbInstances.slice(startIndex, startIndex + 10);
		await GroupPermissionsDB.delete({where: {_id: {$in: subDbInstances.map(e => e._id)}}});
	}
	await AccessLevelPermissionsDB.delete({where: {_id: permissionId}});
	await DomainPermissionsDB.delete({where: {_id: domainId}});
	await ApiPermissionsDB.delete({where: {_id: apiId}});
	await ProjectPermissionsDB.delete({where: {_id: projectId}});
}

async function runAssertion(projectId: string, apiPath: string, userUuid: string, customField: { UnitId: string }) {
	const start = currentTimeMillies();
	await PermissionsAssert.assertUserPermissions(projectId, apiPath, userUuid, customField);
	const runTime = currentTimeMillies() - start;
	console.log(`Call to assertion took ${runTime}ms`);
	return runTime;
}
