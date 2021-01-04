/*
 * A typescript & react boilerplate with api call example
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

import * as React from "react";
// import {Example_FakeMenu} from "../keyboard-listener/Example_FakeMenu";
import {
	Example_List_SingleObjectType,
	Example_List_SingleType
} from "./Example_List_SingleType";
import {Example_NestedList_SingleType} from "./Example_NestedList_SingleType";
import {Example_List_MultiType} from "./Example_List_MultiType";
import {Example_NestedList_MultiType} from "./Example_NestedList_MultiType";


export const Example_List_All = () => (
	<>
		<hr style={{width: "100%"}}/>
		<div className="ll_h_c match_width" style={{justifyContent: "space-between"}}>
			<Example_List_SingleType/>
			<Example_List_SingleObjectType/>
			<Example_NestedList_SingleType/>
		</div>
		<hr style={{width: "100%"}}/>
		<div className="ll_h_c match_width" style={{justifyContent: "space-between"}}>
			<Example_List_MultiType/>
			<Example_NestedList_MultiType/>
		</div>
	</>
);