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
	BeLogged,
	LogClient_MemBuffer,
	Logger,
	padNumber, StaticLogger
} from "../_main";

BeLogged.addClient(new LogClient_MemBuffer("test mem buffer", 10, 1024).setRotationListener(() => {
	StaticLogger.logDebug(`Rotating buffer`);
}));

class TestLogger
	extends Logger {

	writeLogs() {
		for (let i = 0; i < 1000; i++) {
			this.logDebug(`This is a test line ${padNumber(i, 5)}`);
		}
	}
}


new TestLogger().writeLogs();