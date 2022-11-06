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
	assertNoTestErrors,
	runTestSuits,
	TestSuit
} from "../main/testing/test-model";
import {testSuit_versionComparison} from "./version-tools/versions";
import {testSuits_validator} from "./validators/test";
import {testSuit_compare} from "./compare/compare";
import {testSuit_newSecret} from "./newSecret/newSecret";
import {testSuit_filter} from "./object/recursive-find-all-true";
import { testSuit_cliModule } from "./cliModule/test-cliModule";

// require("./logger/test-logger");
// require("./merge/test-merge");
// require("./compare/compare");
// require("./clone/test-clone");

const testSuits: TestSuit<any, any, any>[] = [
	// testSuit_cliModule,
	// testSuit_versionComparison,
	// testSuit_compare,
	// testSuit_newSecret,
	// testSuit_filter,
	...testSuits_validator,
];


runTestSuits(testSuits)
	.then(() => assertNoTestErrors())
	.catch((err) => {
		console.log("Error running tests", err);
		process.exit(2);
	});