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

import {__custom, __scenario, ContextKey, TestException} from '@nu-art/testelot';
import {cleanup, ConfigDB, setupDatabase, testConfig1, testLevel1} from './_core';
import {compare, generateHex, StringMap} from '@nu-art/ts-common';
import {
    AssignAppPermissions,
    ModuleBE_PermissionAccessLevel,
    ModuleBE_PermissionGroup,
    ModuleBE_PermissionUserDB,
    PredefinedGroup
} from '../_main';


const contextKey2 = new ContextKey<ConfigDB>('config-2');
export const Permissions_WorkspaceOwner = {_id: 'workspace-owner', key: 'Workspace', label: 'Owner'};
export const Permissions_WorkspaceEditor = {_id: 'workspace-editor', key: 'Workspace', label: 'Editor'};
export const Permissions_WorkspaceViewer = {_id: 'workspace-viewer', key: 'Workspace', label: 'Viewer'};
export const PermissionWorkspaceGroups = [Permissions_WorkspaceOwner,
    Permissions_WorkspaceEditor,
    Permissions_WorkspaceViewer];

type AssignUserModels = {
    granterUserCF: StringMap,
    givenGroupCF: StringMap,
    givenGroup: PredefinedGroup,
    granterUserGroup: PredefinedGroup,
    label: string,
    expected: boolean,
    runTwice?: boolean
}

const assignUserModels: AssignUserModels[] = [{
    granterUserCF: {workspace: 'workspace1'},
    givenGroupCF: {workspace: 'workspace1'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level and customField',
    expected: true
}, {
    granterUserCF: {workspace: 'workspace1'},
    givenGroupCF: {workspace: 'workspace1'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level and customField, but twice, the second one not test-add-data to db',
    expected: true,
    runTwice: true
}, {
    granterUserCF: {workspace: 'workspace1'},
    givenGroupCF: {workspace: 'workspace1'},
    givenGroup: Permissions_WorkspaceEditor,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter with higher permissions than given group',
    expected: true
}, {
    granterUserCF: {workspace: 'workspace1'},
    givenGroupCF: {workspace: 'workspace1'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceEditor,
    label: 'Granter with lower permissions than given group',
    expected: false
}, {
    granterUserCF: {workspace: 'workspace1'},
    givenGroupCF: {workspace: 'workspace2'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level different customField',
    expected: false
}, {
    granterUserCF: {workspace: 'workspace1'},
    givenGroupCF: {workspace: 'workspace1', test: 'test'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level different given group customField',
    expected: false
}, {
    granterUserCF: {workspace: 'workspace[1-2]', test: 'test'},
    givenGroupCF: {workspace: 'workspace1'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level and covered granter customField',
    expected: true
}, {
    granterUserCF: {},
    givenGroupCF: {workspace: 'workspace1'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level and empty granter customField',
    expected: false
}, {
    granterUserCF: {productId: '.*'},
    givenGroupCF: {productId: '123456'},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level and \'.*\' granter Rex. customField',
    expected: true
}, {
    granterUserCF: {},
    givenGroupCF: {},
    givenGroup: Permissions_WorkspaceOwner,
    granterUserGroup: Permissions_WorkspaceOwner,
    label: 'Granter & given group with the same level and same empty customField, expect to fail cause for assign user permissions: request must have custom fields restriction!',
    expected: false
}];

async function setPredefinedGroupsPermissions(data: ConfigDB) {
    const project = data.project;
    const domain = data.domain;
    await ModuleBE_PermissionGroup.upsertPredefinedGroups(project._id, project.name, PermissionWorkspaceGroups);
    const ownerLevel = await ModuleBE_PermissionAccessLevel.upsert({
        value: 1000,
        name: 'teat-owner-level',
        domainId: domain._id
    });
    const editorLevel = await ModuleBE_PermissionAccessLevel.upsert({
        value: 500,
        name: 'teat-editor-level',
        domainId: domain._id
    });
    const viewerLevel = await ModuleBE_PermissionAccessLevel.upsert({
        value: 200,
        name: 'teat-viewer-level',
        domainId: domain._id
    });
    const ownerGroup = await ModuleBE_PermissionGroup.queryUnique({_id: ModuleBE_PermissionGroup.getPredefinedGroupId(project._id, Permissions_WorkspaceOwner._id)});
    const editorGroup = await ModuleBE_PermissionGroup.queryUnique({_id: ModuleBE_PermissionGroup.getPredefinedGroupId(project._id, Permissions_WorkspaceEditor._id)});
    const viewerGroup = await ModuleBE_PermissionGroup.queryUnique({_id: ModuleBE_PermissionGroup.getPredefinedGroupId(project._id, Permissions_WorkspaceViewer._id)});
    await ModuleBE_PermissionGroup.upsertAll([{...ownerGroup, accessLevelIds: [ownerLevel._id]}, {
        ...editorGroup,
        accessLevelIds: [editorLevel._id]
    }, {
        ...viewerGroup,
        accessLevelIds: [viewerLevel._id]
    }]);
}

export function assignUserPermissionsTests() {
    const scenario = __scenario('Assign user permissions');
    let satisfy;
    let oneTimeFlag = true;
    scenario.add(cleanup());
    scenario.add(setupDatabase(testConfig1, testLevel1).setWriteKey(contextKey2));
    for (const model of assignUserModels) {
        scenario.add(__custom(async (action, data) => {
            if (oneTimeFlag)
                await setPredefinedGroupsPermissions(data);

            oneTimeFlag = false;
            satisfy = await isAssignUsersPermissions(data, model);
            if (satisfy !== model.expected)
                throw new TestException(`Expect assign user permissions to be ${model.expected}, but you got ${!model.expected}`);
        }).setReadKey(contextKey2).setLabel(model.label));
    }

    return scenario;
}

async function isAssignUsersPermissions(data: ConfigDB, assignUserObj: AssignUserModels) {
    let satisfy = true;
    const project = data.project;
    const usersObjects = [];
    const assignUserNumbers = 4;
    for (let i = 0; i < assignUserNumbers; i++) {
        usersObjects.push({accountId: generateHex(32), groups: []});
    }

    const users = await ModuleBE_PermissionUser.upsertAll(usersObjects);
    const usersAccountIds = users.map(userItem => userItem.accountId);
    const granterUser = await ModuleBE_PermissionUser.upsert({
        accountId: generateHex(32),
        groups: [{
            groupId: ModuleBE_PermissionGroup.getPredefinedGroupId(project._id, assignUserObj.granterUserGroup._id),
            customField: assignUserObj.granterUserCF
        }]
    });

    const assignAppPermissionsObj: AssignAppPermissions = {
        projectId: project._id,
        group: assignUserObj.givenGroup,
        groupsToRemove: PermissionWorkspaceGroups,
        sharedUserIds: usersAccountIds,
        granterUserId: granterUser.accountId,
        customField: assignUserObj.givenGroupCF,
        customKey: generateHex(32)
    };

    try {
        await ModuleBE_PermissionUser.assignAppPermissions(assignAppPermissionsObj);
        if (assignUserObj.runTwice) {
            await ModuleBE_PermissionUser.assignAppPermissions(assignAppPermissionsObj);
        }
    } catch (e: any) {
        return false;
    }

    const assignedUsers = await ModuleBE_PermissionUser.query({where: {accountId: {$in: usersAccountIds}}});

    if (assignedUsers.length !== assignUserNumbers)
        satisfy = false;

    assignedUsers.forEach(assignedUser => {
        if (!assignedUser.groups || assignedUser.groups.length !== 1 || !compare(assignedUser.groups[0].customField, assignAppPermissionsObj.customField)) {
            satisfy = false;
        }
    });

    return satisfy;
}

