/*
 * A typescript & react boilerplate with api call example
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

import * as React from "react";
// import {Example_FakeMenu} from "../keyboard-listener/Example_FakeMenu";
import {PlaygroundExample_GroupStyle} from "../consts";
import {Playground_DropdownSingleAndMulti} from "../dropdown/Example_Dropdown_SingleAndMulti";
import {Playground_DropdownMultiType} from "../dropdown/Example_Dropdown_MultiType";
import {Playground_DropdownSingleType} from "../dropdown/Example_Dropdown_SingleType";
import {Playground_Tree_Data} from "../keyboard-listener/Example_Tree_Data";
import {Playground_Tree_Basic} from "../keyboard-listener/Example_Tree_Basic";
import {Playground_Tree_MultiType} from "../keyboard-listener/Example_Tree_MultiType";

export const TreeRefactorPage = () => (<>
	<div className="ll_v_l" style={{width: "100%", height: "100%"}}>
		<div {...PlaygroundExample_GroupStyle}>
				{Playground_DropdownSingleAndMulti().renderer()}
				{Playground_DropdownSingleType().renderer()}
				{Playground_DropdownMultiType().renderer()}
		</div>
		<div {...PlaygroundExample_GroupStyle}>
				{Playground_Tree_Data().renderer()}
				{Playground_Tree_Basic().renderer()}
				{Playground_Tree_MultiType().renderer()}
		</div>
	</div>
</>);