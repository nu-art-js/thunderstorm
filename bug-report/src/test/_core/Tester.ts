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
	ImplementationMissingException,
	ModuleManager
} from "@nu-art/ts-common";
import {
	__scenario,
	Reporter,
	Scenario
} from "@nu-art/testelot";

export class Tester
	extends ModuleManager {
	private scenario!: Scenario;
	private reporter = new Reporter();

	constructor() {
		super();
	}

	setScenario(scenario: Scenario) {
		this.scenario = scenario;
		return this;
	}

	build() {
		const pwd = process.env.PWD;
		let packageName: string;
		if (pwd)
			packageName = pwd.substring(pwd.lastIndexOf("/") + 1);
		this.runTestsImpl()
		    .then(() => {
			    const errorCount = this.reporter.summary.Error;
			    if (errorCount > 0) {
				    this.logError(`Package: ${packageName} - Tests ended with ${errorCount} ${errorCount === 1 ? "error" : "errors"}`);
				    process.exit(2);
			    }

			    this.logInfo(`Package: ${packageName} - Tests completed successfully`)
			    process.exit(0);
		    })
		    .catch(reason => {
			    this.logError(`Package: ${packageName} - Tests failed`, reason);
			    process.exit(3);
		    });
	}

	private runTestsImpl = async () => {
		this.init();
		if (!this.scenario)
			throw new ImplementationMissingException("No test specified!!");

		this.reporter.init();

		const scenario = __scenario("root", this.reporter);
		scenario.add(this.scenario);
		await scenario.run();
	};
}
