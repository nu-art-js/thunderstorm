import {
	ImplementationMissingException,
	ModuleManager
} from "@nu-art/ts-common";
import {
	__scenario,
	Action,
	Reporter,
	Scenario
} from "..";

export class AppTester
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

	prepare() {
	}

	runTestsImpl = async () => {
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
}