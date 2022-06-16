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

import {ModulePack_Backend_Permissions} from '../main/backend';
import {StormTester} from '@nu-art/thunderstorm/backend-test';
import {__scenario} from '@nu-art/testelot';
import {createTwoAccessLevels} from './tests/create-project';
import {
	checkAccessLevelsPropertyOfGroup,
	checkCreateUserWithEmptyGroups,
	checkCreateUserWithGroups,
	checkDeleteAccessLevelsDocument,
	checkGroupAccessLevelsAfterPatchingLevelDocument,
	checkGroupAccessLevelsAfterUpdatingLevelDocument,
	checkInsertUserIfNotExist,
	checkInsertUserIfNotExistByExistUser,
	checkPatchOfGroupAccessLevelsProperty,
	checkPatchOfGroupAccessLevelsPropertyToHigherValue,
	checkUpdatedUserGroups,
	checkUpdateOfGroupAccessLevelsProperty,
	checkUpdateOfGroupAccessLevelsPropertyToHigherValue,
	createApi,
	createApiWithAccessLevel,
	createGroupWithLegalCustomField,
	createTowGroups,
	createTowUsers,
	createUser,
	createUserWithDuplicateGroupIdButDifferentCustomField,
	createUserWithGroups,
	failedCreateApi,
	failedCreateGroupWithDuplicateAccessLevel,
	failedCreateTwoGroupsWithSameName,
	failedCreateUserWithDuplicateGroups,
	failedCreateUserWithDuplicateGroupsButOneUndefinedCFAndOtherEmptyObj,
	failedDeleteGroupAssociatedToUser,
	failToCreateGroupWithIllegalCustomField,
	tryDeleteAccessLevelAssociatedWithApi,
	tryDeleteAccessLevelAssociatedWithGroup,
	tryDeleteDomainAssociatedWithAccessLevel
} from './tests/permissions-manage';
import {permissionsAssertDoesCustomFieldsSatisfiesTests, permissionsAssertIsLevelsMatchTests} from './tests/permissions-assert';
import {FirebaseModule} from '@nu-art/firebase/backend';
import {AccountModule} from '@nu-art/user-account/backend';
import {assignUserPermissionsTests} from './tests/assign-permissions';
import {
	expectToFailTestFullAssertUserPermissionsWithNonGroupCFCovered,
	expectToFailTestFullAssertUserPermissionsWithNonGroupCFRegValueCovered,
	expectToFailTestFullAssertUserPermissionsWithNonGroupCFValueCovered,
	testFullAssertUserPermissionsWithEmptyUserCFsArrayAndEmptyRequestCFObj,
	testFullAssertUserPermissionsWithExtraGroupCFCovered
} from './tests/full-permission-user-assert';


export const mainScenario = __scenario('Permissions');

mainScenario.add(createUser());
mainScenario.add(createUserWithGroups());
mainScenario.add(createTowUsers());

mainScenario.add(failedDeleteGroupAssociatedToUser());

mainScenario.add(failedCreateUserWithDuplicateGroups());
mainScenario.add(createUserWithDuplicateGroupIdButDifferentCustomField());

mainScenario.add(createTwoAccessLevels());
mainScenario.add(createApi());
mainScenario.add(failedCreateApi());
mainScenario.add(checkCreateUserWithGroups());
mainScenario.add(checkCreateUserWithEmptyGroups());
mainScenario.add(checkAccessLevelsPropertyOfGroup());
mainScenario.add(checkUpdatedUserGroups());
mainScenario.add(checkUpdateOfGroupAccessLevelsProperty());
mainScenario.add(checkUpdateOfGroupAccessLevelsPropertyToHigherValue());
mainScenario.add(checkPatchOfGroupAccessLevelsProperty());
mainScenario.add(checkGroupAccessLevelsAfterPatchingLevelDocument());
mainScenario.add(checkPatchOfGroupAccessLevelsPropertyToHigherValue());
mainScenario.add(checkGroupAccessLevelsAfterUpdatingLevelDocument());
mainScenario.add(createTowGroups());
mainScenario.add(createGroupWithLegalCustomField());
mainScenario.add(failToCreateGroupWithIllegalCustomField());
mainScenario.add(failedCreateTwoGroupsWithSameName());
mainScenario.add(failedCreateGroupWithDuplicateAccessLevel());
mainScenario.add(failedCreateUserWithDuplicateGroupsButOneUndefinedCFAndOtherEmptyObj());
mainScenario.add(createApiWithAccessLevel());

mainScenario.add(permissionsAssertIsLevelsMatchTests());
mainScenario.add(permissionsAssertDoesCustomFieldsSatisfiesTests());

mainScenario.add(tryDeleteDomainAssociatedWithAccessLevel());
mainScenario.add(tryDeleteAccessLevelAssociatedWithGroup());
mainScenario.add(tryDeleteAccessLevelAssociatedWithApi());
mainScenario.add(checkDeleteAccessLevelsDocument());

mainScenario.add(checkInsertUserIfNotExist());
mainScenario.add(checkInsertUserIfNotExistByExistUser());

mainScenario.add(assignUserPermissionsTests());

mainScenario.add(testFullAssertUserPermissionsWithExtraGroupCFCovered());
mainScenario.add(testFullAssertUserPermissionsWithEmptyUserCFsArrayAndEmptyRequestCFObj());
mainScenario.add(expectToFailTestFullAssertUserPermissionsWithNonGroupCFCovered());
mainScenario.add(expectToFailTestFullAssertUserPermissionsWithNonGroupCFValueCovered());
mainScenario.add(expectToFailTestFullAssertUserPermissionsWithNonGroupCFRegValueCovered());

module.exports = new StormTester()
	.addModules(FirebaseModule)
	.addModules(AccountModule)
	.addModules(...ModulePack_Backend_Permissions)
	.setScenario(mainScenario)
	.build();





