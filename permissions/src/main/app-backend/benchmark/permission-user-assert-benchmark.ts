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

import {batchAction, currentTimeMillis, filterInstances, generateHex, PreDB} from '@nu-art/ts-common';
import {PermissionsAssert} from '../modules/permissions-assert';
import {DB_PermissionGroup, User_Group} from '../..';
import {ModuleBE_PermissionAccessLevel, ModuleBE_PermissionApi, ModuleBE_PermissionDomain, ModuleBE_PermissionProject} from '../modules/management';
import {ModuleBE_PermissionGroup, ModuleBE_PermissionUser} from '../modules/assignment';


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
	console.log('---￿Inside of permissions test---');
	const projectId = 'project-test-ten';
	const apiId = generateHex(32);
	const userId = generateHex(32);
	const apiPath = '/v1/test/test-it10';
	const userUuid = 'test10@intuitionrobotics.com';
	const permissionId = generateHex(32);
	const domainId = generateHex(32);
	const permissionValue = 50;
	const customField = {UnitId: 'eq1'};
	await ModuleBE_PermissionProject.upsert({_id: projectId, name: 'project test'});
	await ModuleBE_PermissionDomain.upsert({_id: domainId, projectId: projectId, namespace: 'domain-test'});
	const accessLevel = await ModuleBE_PermissionAccessLevel.upsert({_id: permissionId, name: 'test-permission', domainId, value: permissionValue});
	await ModuleBE_PermissionApi.upsert({projectId: projectId, _id: apiId, path: apiPath, accessLevelIds: [permissionId]});

	const groupIdArray: User_Group[] = [];
	const dbInstances: PreDB<DB_PermissionGroup>[] = [];
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
		groupIdArray.push({groupId, customField: {test: 'test'}});
	}

	console.log('dbInstances ready to upsert');

	await ModuleBE_PermissionGroup.upsertAll(dbInstances);

	await ModuleBE_PermissionUser.upsert({_id: userId, accountId: userUuid, groups: groupIdArray});

	const tests = new Array<number>().fill(0, 0, 50);
	const durations: number[] = await Promise.all(tests.map(test => runAssertion(projectId, apiPath, userUuid, customField)));
	const sum = durations.reduce((_sum, val) => _sum + val, 0);
	console.log(`Call to assertion on ${tests.length} call took on agerage ${sum / tests.length}ms`);

	// ----deletes db documents---
	await ModuleBE_PermissionUser.delete({where: {_id: userId}});
	await batchAction(filterInstances(dbInstances.map(i => i._id)), 10, chunk => ModuleBE_PermissionGroup.delete({where: {_id: {$in: chunk}}}));
	await ModuleBE_PermissionAccessLevel.delete({where: {_id: permissionId}});
	await ModuleBE_PermissionDomain.delete({where: {_id: domainId}});
	await ModuleBE_PermissionApi.delete({where: {_id: apiId}});
	await ModuleBE_PermissionProject.delete({where: {_id: projectId}});
}

async function runAssertion(projectId: string, apiPath: string, userUuid: string, customField: { UnitId: string }) {
	const start = currentTimeMillis();
	await PermissionsAssert.assertUserPermissions(projectId, apiPath, userUuid, customField);
	const runTime = currentTimeMillis() - start;
	console.log(`Call to assertion took ${runTime}ms`);
	return runTime;
}
