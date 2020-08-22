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
import {Example_DataTree} from "../keyboard-listener/Example_DataTree";
// import {Example_FakeMenu} from "../keyboard-listener/Example_FakeMenu";
import {Example_VerySimpleTree} from "../keyboard-listener/Example_VerySimpleTree";
import {COLORS} from "@res/colors";
import {Example_AllDropDowns} from "../dropdown/Example_AllDropDowns";

export const TreeRefactorPage = () => (<>
	<div style={{width: "100%", height:"400px"}}>
		<Example_AllDropDowns/>
	</div>
	<hr style={{width: "100%"}}/>
	<div className="ll_h_c match_width" style={{justifyContent: "space-between"}}>
		<Example_DataTree/>
		<div style={{height: "100%", width: "1px", background: COLORS.amber()}}/>
		{/*<Example_FakeMenu/>*/}
		<div style={{height: "100%", width: "1px", background: COLORS.amber()}}/>
		<Example_VerySimpleTree/>
	</div>
	{/*<hr style={{width: "100%"}}/>*/}
	{/*<Example_Menu/>*/}
</>);