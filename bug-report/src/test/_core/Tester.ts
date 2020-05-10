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

	init() {
		super.init();
		return this;
	}

	prepare = () => {
	};

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
