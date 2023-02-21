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

import {ImplementationMissingException} from '@nu-art/ts-common';
import {BaseStorm} from '../../src/main/backend/core/BaseStorm';
import {__scenario, Reporter, Scenario} from '@nu-art/testelot';


export class StormTester
	extends BaseStorm {
	private scenario!: Scenario;
	private reporter = new Reporter();

	constructor() {
		super();
		this.setEnvironment('test-permissions');
	}

	setScenario(scenario: Scenario) {
		this.scenario = scenario;
		return this;
	}

	build() {
		const pwd = process.env.PWD;
		let packageName: string;
		if (pwd)
			packageName = pwd.substring(pwd.lastIndexOf('/') + 1);

		this.runTestsImpl()
			.then(() => {
				const errorCount = this.reporter.summary.Error;
				if (errorCount > 0) {
					this.logError(`Package: ${packageName} - Tests ended with ${errorCount} ${errorCount === 1 ? 'error' : 'errors'}`);
					process.exit(2);
				}

				this.logInfo(`Package: ${packageName} - Tests completed successfully`);
				process.exit(0);
			})
			.catch(reason => {
				this.logError(`Package: ${packageName} - Tests failed`, reason);
				process.exit(3);
			});
	}

	runTestsImpl = async () => {
		if (!this.scenario)
			throw new ImplementationMissingException('No test specified!!');

		this.init();
		this.reporter.init();

		const scenario = __scenario('root', this.reporter);
		scenario.add(this.scenario);
		await scenario.run();
	};
}