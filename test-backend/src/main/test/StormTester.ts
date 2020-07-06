/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {FirebaseModule} from "@nu-art/firebase/backend";
import {
	BeLogged,
	ImplementationMissingException,
	LogClient_Terminal,
	Module
} from "@nu-art/ts-common";
import {Firebase_ExpressFunction} from '@nu-art/firebase/backend-functions';
import {BaseStorm} from "@nu-art/thunderstorm/app-backend/core/BaseStorm";
import {HttpServer} from "@nu-art/thunderstorm/backend";
import {
	__scenario,
	Reporter,
	Scenario,
	Action
} from "@nu-art/testelot";

const modules: Module[] = [
	HttpServer,
	FirebaseModule,
];

export class StormTester
	extends BaseStorm {
	private function!: any;
	private scenario?: Scenario;
	private reporter = new Reporter();

	constructor() {
		super();
		this.addModules(...modules);
		BeLogged.addClient(LogClient_Terminal);
	}

	setScenario(scenario: Scenario) {
		this.scenario = scenario;
		return this;
	}

	build() {
		this.function = new Firebase_ExpressFunction(HttpServer.express);
		const pwd = process.env.PWD;
		let packageName: string;
		if (pwd)
			packageName = pwd.substring(pwd.lastIndexOf("/") + 1);

		this.startServerImpl()
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

		return {test: this.function.getFunction()}
	}

	private async startServerImpl() {
		if (!this.scenario)
			throw new ImplementationMissingException("No test specified!!");

		await this.resolveConfig();

		this.init();

		await HttpServer.startServer();

		this.reporter.init();
		Action.resolveTestsToRun()

		const scenario = __scenario("root", this.reporter);
		scenario.add(this.scenario);
		await scenario.run();

		await HttpServer.terminate();
	}
}
