/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import * as fs from "fs";
import {
	ImplementationMissingException,
	ModuleManager
} from "@intuitionrobotics/ts-common";
import {
	__scenario,
	Action,
	Reporter,
	Scenario
} from "@intuitionrobotics/testelot";
import {
	FirebaseModule,
	FirebaseModule_Class
} from "../_main";

export class FirebaseTester
	extends ModuleManager {
	private scenario!: Scenario;
	private reporter = new Reporter();

	constructor() {
		super();
	}

	init() {
		super.init();
		return this;
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

	prepare = () => {
		FirebaseModule_Class.localAdminConfigId = "test-permissions";

		const serviceAccount = this.resolveServiceAccount();
		FirebaseModule.setDefaultConfig({"test-permissions": serviceAccount});
	};

	private runTestsImpl = async () => {
		if (!this.scenario)
			throw new ImplementationMissingException("No test specified!!");

		this.prepare();
		this.init();
		this.reporter.init();

		Action.resolveTestsToRun()
		const scenario = __scenario("root", this.reporter);
		scenario.add(this.scenario);
		await scenario.run();
	};

	private resolveServiceAccount() {
		let pathToServiceAccount = process.env.npm_config_service_account || process.argv.find((arg: string) => arg.startsWith("--service-account="));
		if (!pathToServiceAccount)
			throw new ImplementationMissingException("could not find path to service account!!!");

		pathToServiceAccount = pathToServiceAccount.replace("--service-account=", "");
		return JSON.parse(fs.readFileSync(pathToServiceAccount, "utf8"))
	}
}