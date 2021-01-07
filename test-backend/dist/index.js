"use strict";
/*
 * A backend boilerplate with example apis
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
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-import-side-effect
require("module-alias/register");
var StormTester_1 = require("./test/StormTester");
var _core_1 = require("./test/_core");
var testelot_1 = require("@intuitionrobotics/testelot");
var mainScenario = testelot_1.__scenario('root');
mainScenario.add(_core_1.runTest);
module.exports = new StormTester_1.StormTester()
    .setEnvironment('dev')
    .setScenario(mainScenario)
    .build();
//# sourceMappingURL=index.js.map