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

import {
	BeLogged,
	Logger,
	padNumber
} from "@nu-art/ts-common";
import {LogClient_File} from "../../main/app-backend/utils/LogClient_File";

BeLogged.addClient(new LogClient_File("logger", "../.trash/logger-test", 10, 1024).setRotationListener(() => {
	console.log(`Rotating buffer`);
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