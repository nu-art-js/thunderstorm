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

import {Backend_ModulePack_Permissions} from "../main/backend";
import {StormTester} from "@nu-art/thunderstorm/backend-test";
import {__scenario} from "@nu-art/testelot";
import {createTwoAccessLevels} from "./tests/create-project";
import {
	checkAccessLevelsPropertyOfGroup,
	checkAccessLevelsPropertyOfUser,
	checkGroupAccessLevelsAfterPatchingLevelDocument,
	checkGroupAccessLevelsAfterUpdatingLevelDocument,
	checkInsertUserIfNotExist,
	checkInsertUserIfNotExistByExistUser,
	checkPatchOfGroupAccessLevelsProperty,
	checkPatchOfGroupAccessLevelsPropertyToHigherValue,
	checkPatchOfUserAccessLevelsProperty,
	checkPatchOfUserAccessLevelsPropertyToHigherValue,
	checkUpdateOfGroupAccessLevelsProperty,
	checkUpdateOfGroupAccessLevelsPropertyToHigherValue,
	checkUpdateOfUserAccessLevelsProperty,
	checkUpdateOfUserAccessLevelsPropertyToHigherValue,
	checkUserAccessLevelsAfterPatchingLevelDocument,
	checkUserAccessLevelsAfterUpdatingLevelDocument,
	createApi,
	createApiWithAccessLevel,
	createGroupWithLegalCustomField,
	createTowGroups,
	createTowUsers,
	failedCreateApi,
	failedCreateGroupWithDuplicateAccessLevel,
	failedCreateTwoGroupsWithSameName,
	failedCreateUserWithDuplicateAccessLevel,
	failedCreateUserWithDuplicateGroups,
	failToCreateGroupWithIllegalCustomField,
	tryDeleteAccessLevelAssociatedWithApi,
	tryDeleteAccessLevelAssociatedWithGroup,
	tryDeleteDomainAssociatedWithAccessLevel
} from "./tests/permissions-manage";
import {
	permissionsAssertDoesCustomFieldsSatisfiesTests,
	permissionsAssertIsLevelsMatchTests
} from "./tests/permissions-assert";
import { FirebaseModule } from "@nu-art/firebase/backend";


export const mainScenario = __scenario("Permissions");

mainScenario.add(createTwoAccessLevels());
mainScenario.add(createApi());
mainScenario.add(failedCreateApi());
mainScenario.add(checkAccessLevelsPropertyOfGroup());
mainScenario.add(checkUpdateOfGroupAccessLevelsProperty());
mainScenario.add(checkAccessLevelsPropertyOfUser());
mainScenario.add(checkUpdateOfUserAccessLevelsProperty());
mainScenario.add(checkUpdateOfGroupAccessLevelsPropertyToHigherValue());
mainScenario.add(checkPatchOfGroupAccessLevelsProperty());
mainScenario.add(checkGroupAccessLevelsAfterPatchingLevelDocument());
mainScenario.add(checkPatchOfGroupAccessLevelsPropertyToHigherValue());
mainScenario.add(checkUpdateOfUserAccessLevelsPropertyToHigherValue());
mainScenario.add(checkGroupAccessLevelsAfterUpdatingLevelDocument());
mainScenario.add(checkUserAccessLevelsAfterUpdatingLevelDocument());
mainScenario.add(checkPatchOfUserAccessLevelsProperty());
mainScenario.add(checkUserAccessLevelsAfterPatchingLevelDocument());
mainScenario.add(checkPatchOfUserAccessLevelsPropertyToHigherValue());
mainScenario.add(createTowGroups());
mainScenario.add(createGroupWithLegalCustomField());
mainScenario.add(failToCreateGroupWithIllegalCustomField());
mainScenario.add(failedCreateTwoGroupsWithSameName());
mainScenario.add(failedCreateGroupWithDuplicateAccessLevel());
mainScenario.add(createTowUsers());
mainScenario.add(failedCreateUserWithDuplicateAccessLevel());
mainScenario.add(failedCreateUserWithDuplicateGroups());
mainScenario.add(createApiWithAccessLevel());
mainScenario.add(checkInsertUserIfNotExist());
mainScenario.add(checkInsertUserIfNotExistByExistUser());

mainScenario.add(permissionsAssertIsLevelsMatchTests());
mainScenario.add(permissionsAssertDoesCustomFieldsSatisfiesTests());

mainScenario.add(tryDeleteDomainAssociatedWithAccessLevel());
mainScenario.add(tryDeleteAccessLevelAssociatedWithGroup());
mainScenario.add(tryDeleteAccessLevelAssociatedWithApi());

module.exports = new StormTester()
	.addModules(FirebaseModule)
	.addModules(...Backend_ModulePack_Permissions)
	.setScenario(mainScenario)
	.build();





