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

import {StormTester} from "@ir/thunderstorm/backend-test";
import {
	createUser,
	testBadSessionID,
	testLoginWithWrongPass,
	testLoginWithWrongUser,
	testSuccessfulLogin
} from "./tests/create-user";
import {AccountModule} from "./_main";
import {__scenario} from "@ir/testelot";
import {FirebaseModule} from "@ir/firebase/backend";

export const mainScenario = __scenario("login");

mainScenario.add(createUser());
mainScenario.add(testSuccessfulLogin());
mainScenario.add(testLoginWithWrongPass());
mainScenario.add(testLoginWithWrongUser());
mainScenario.add(testBadSessionID());

module.exports = new StormTester()
	.addModules(FirebaseModule)
	.addModules(AccountModule)
	.setScenario(mainScenario)
	.build();





