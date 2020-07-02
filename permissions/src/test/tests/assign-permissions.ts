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

import {
	__custom,
	__scenario,
	TestException
} from "@nu-art/testelot";
import {cleanup} from "./_core";
import {
	GroupPermissionsDB,
	UserPermissionsDB
} from "../../main/app-backend/modules/db-types/assign";
import {AssignAppPermissions} from "../../main";
import {ProjectPermissionsDB} from "../../main/app-backend/modules/db-types/managment";
import {
	compare,
	generateHex
} from "@nu-art/ts-common";

const project1 = {name: "Project One", _id: "project-one"};
export const Permissions_WorkspaceOwner = {_id: "workspace-owner", key: "Workspace", label: "Owner"}
export const Permissions_WorkspaceEditor = {_id: "workspace-editor", key: "Workspace", label: "Editor"}
export const Permissions_WorkspaceViewer = {_id: "workspace-viewer", key: "Workspace", label: "Viewer"}
export const PermissionWorkspaceGroups = [Permissions_WorkspaceOwner,
                                          Permissions_WorkspaceEditor,
                                          Permissions_WorkspaceViewer]


export function assignUserPermissions() {
	const scenario = __scenario("Assign user permissions");
	scenario.add(cleanup());
	scenario.add(__custom(async (action, data) => {
		const project = await ProjectPermissionsDB.upsert(project1);
		const user = await UserPermissionsDB.upsert({accountId: generateHex(32), groups: []});
		await GroupPermissionsDB.upsertPredefinedGroups(project._id, project.name, PermissionWorkspaceGroups);

		const assignAppPermissionsObj: AssignAppPermissions = {
			projectId: project._id,
			group: Permissions_WorkspaceOwner,
			groupsToRemove: PermissionWorkspaceGroups,
			sharedUserIds: [user.accountId],
			granterUserId: user.accountId,
			customField: {workspace: "workspace1"},
			customKey: generateHex(32)
		};

		await UserPermissionsDB.assignAppPermissions(assignAppPermissionsObj);
		const assignedUser = await UserPermissionsDB.queryUnique({_id: user._id});

		if (!assignedUser.groups || assignedUser.groups.length !== 1 || !compare(assignedUser.groups[0].customField, assignAppPermissionsObj.customField)) {
			throw new TestException("User didn't assigned with permissions");
		}
	}).setLabel('Assign user permissions has been successfully'));
	return scenario;
}

