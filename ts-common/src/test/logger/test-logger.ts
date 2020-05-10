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
	LogClient_Terminal,
	MUSTNeverHappenException,
	ThisShouldNotHappenException,
	Logger,
	BeLogged
} from "../_main";


class TestLogger
	extends Logger {

	printOneLine() {
		this.logInfo("this is one line");
	}

	printTwoLines() {
		this.logInfo("this is line 1/2\nthis is line 2/2");
	}

	printOnlyError() {
		this.logInfo(new Error("this is a lonely error"));
	}

	printMyLonelyException() {
		this.logInfo(new ThisShouldNotHappenException("this is a my lonely Exception"));
	}

	printTextWithError() {
		this.logInfo("One line text.. with error", new Error("this is the error"));
	}

	printTextWithMyExceptionNoCause() {
		this.logInfo("One line text.. with my exception without a cause", new ThisShouldNotHappenException("this is the error without a cause"));
	}


	callOne() {
		this.callTwo();
	}

	callTwo() {
		this.throwError();
	}

	throwError() {
		throw new MUSTNeverHappenException("throwing an intentional error");
	}

	printTextWithMyExceptionWithCause() {
		try {
			this.callOne()
		} catch (e) {
			this.logInfo("One line text.. with my exception with a cause",
			             new ThisShouldNotHappenException("this is the error with a cause", e));
		}
	}
}


BeLogged.addClient(LogClient_Terminal);

const testLogger = new TestLogger();
console.log("--");
testLogger.printOneLine();
console.log("--");
testLogger.printTwoLines();
console.log("--");
testLogger.printOnlyError();
console.log("--");
testLogger.printMyLonelyException();
console.log("--");
testLogger.printTextWithError();
console.log("--");
testLogger.printTextWithMyExceptionNoCause();
console.log("--");
testLogger.printTextWithMyExceptionWithCause();
console.log("--");
