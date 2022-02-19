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

import * as React from 'react';
import {Playground, PlaygroundScreen} from "@nu-art/thunderstorm/frontend";
import {Page_ApiGen} from "../pages/Page_ApiGen";
import {Hello} from "../Hello";
import {Example_ApiCustomError} from './examples/Example_ApiCustomError';
import {Example_Dialogs} from './examples/Example_Dialogs';
import {Example_Toaster} from './examples/Example_Toaster';
import {TreeRefactorPage} from "./examples/_to-be-removed/TreeRefactorPage";
import {ICONS} from "@res/icons";
import {COLORS} from "@res/colors";
import {Example_Form} from "./examples/Example_Form";
import {Example_TriggerPush} from "./examples/Example_TriggerPush";
import {Example_AllDropDowns} from "./examples/dropdown/Example_AllDropDowns";
import {Playground_DropdownSingleAndMulti} from "./examples/dropdown/Example_Dropdown_SingleAndMulti";
import {Example_List_SingleType} from "./examples/list/Example_List_SingleType";
import {Example_List_MultiType} from "./examples/list/Example_List_MultiType";
import {Example_NestedList_SingleType} from './examples/list/Example_NestedList_SingleType';
import {
	Example_NestedList_MultiType,
	Example_NestedList_MultiType_Object,
	Example_NestedList_MultiType_Object_Dynamic
} from './examples/list/Example_NestedList_MultiType';
import {Example_List_All} from "./examples/list/Example_List_All";
import {Example_Tree_SingleType} from './examples/tree/Example_Tree_SingleType';
import {Example_List_WithInput} from './examples/list/Example_List_WithInput';
import {Example_FilterInput} from "./examples/Example_FilterInput";
import {Example_Uploader} from "./examples/Example_Uploader";
import {Example_TSInput} from "./examples/Example_TSInput";
import {Example_PermissionsComponent} from "./examples/Example_PermissionsComponent";
import {SP_Example_Tree_SingleType} from "./examples/new-props-examples/tree/SP_Example_Tree_SingleType";
import {SP_Example_NestedList_SingleType} from "./examples/new-props-examples/list/SP_Example_NestedList_SingleType";
import {SP_Example_List_MultiType} from "./examples/new-props-examples/list/SP_Example_List_MultiType";
import {SP_Example_List_SingleType} from "./examples/new-props-examples/list/SP_Example_List_SingleType";
import {SP_Example_NestedList_MultiType} from "./examples/new-props-examples/list/SP_Example_NestedList_MultiType";
import {Example_Analytics} from "./examples/Example_Analytics";
import Example_Scatter from "./examples/Example_Scatter";
import {Example_TSTextArea} from "./examples/Example_TSTextArea";
import Example_CCgraphs from "./examples/Example_CCgraphs";
import {Example_FieldEditorClick} from './examples/Example_FieldEditorClick';
import {Example_Tree_MultiType} from "./examples/tree/Example_Tree_MultiType";
import { Playground_DropdownSingleType } from './examples/dropdown/Example_Dropdown_SingleType';
import {Playground_DropdownMultiType} from "./examples/dropdown/Example_Dropdown_MultiType";
import {Playground_Tree_Data} from "./examples/keyboard-listener/Example_Tree_Data";
import {Playground_Tree_Basic} from "./examples/keyboard-listener/Example_Tree_Basic";
import {Playground_Tree_MultiType} from "./examples/keyboard-listener/Example_Tree_MultiType";

export const selectStyles = {
	container: (provided: any) => ({
		...provided,
		width: 240,
		fontSize: 13,
		outline: "none"
	}),
	control: () => ({
		border: "1px solid",
		color: COLORS.blueGrey,
		display: "flex",
		height: 32,
		fontSize: 13,
		outline: "none"
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: COLORS.blueGrey,
		fontWeight: 500
	}),
	input: (provided: any) => ({
		...provided,
		color: "#fff"
	}),
	option: (provided: any, state: any) => ({
		...provided,
		backgroundColor: "unset",
		color: COLORS.blueGrey,
		':hover': {
			backgroundColor: COLORS.veryLightPink
		}
	}),
};

export class Page_Playground
	extends React.Component<{}> {

	constructor(props: {}) {
		super(props);
		this.state = {};
	}

	render() {
		const screens = this.getScreens();
		return <Playground
			selectStyle={selectStyles}
			iconClose={ICONS.arrowClose(COLORS.veryLightPink())}
			iconOpen={ICONS.arrowOpen(COLORS.veryLightPink())}
			screens={screens}
		/>;
	}

	getScreens(): PlaygroundScreen[] {
		return [
			// Inputs
			{renderer: Example_TSInput, name: "TSInput Example"},
			{renderer: Example_TSTextArea, name: "TSTextArea Example"},
			{renderer: Example_FieldEditorClick, name: "FieldEditorClick Example"},

			// DROPDOWNS
			Playground_DropdownSingleAndMulti(),
			{renderer: Example_FilterInput, name: "FilterInput Examples"},
			{renderer: Example_AllDropDowns, name: "ALL DropDown Examples"},
			Playground_DropdownSingleType(),
			Playground_DropdownMultiType(),

			// SWITCH PROPS
			// TREES / LISTS
			{renderer: SP_Example_Tree_SingleType, name: "SP_Example_Tree_SingleType",},
			{renderer: SP_Example_List_MultiType, name: "SP_Example_List_MultiType",},
			{renderer: SP_Example_List_SingleType, name: "SP_Example_List_SingleType",},
			{renderer: SP_Example_NestedList_SingleType, name: "SP_Example_NestedList_SingleType",},
			{renderer: SP_Example_NestedList_MultiType, name: "SP_Example_NestedList_MultiType",},

			// TREES / LISTS
			Playground_Tree_Data(),
			Playground_Tree_Basic(),
			Playground_Tree_MultiType(),
			{renderer: Example_Tree_SingleType, name: "Tree_SingleType",},
			{renderer: Example_Tree_MultiType, name: "Tree_MultiType",},
			{renderer: Example_List_SingleType, name: "List_SingleType_Menu",},
			{renderer: Example_NestedList_SingleType, name: "List_SingleType_NestedMenu",},
			{renderer: Example_List_MultiType, name: "List_MultiType_Menu",},
			{renderer: Example_NestedList_MultiType, name: "NestedList_MultiType",},
			{renderer: Example_List_WithInput, name: "Example_List_WithInput",},
			{renderer: Example_NestedList_MultiType_Object, name: "NestedList_MultiType_Object",},
			{renderer: Example_NestedList_MultiType_Object_Dynamic, name: "NestedList_MultiType_Object_Dynamic",},
			{renderer: Example_List_All, name: "Example_List_All",},

			{renderer: Example_Uploader, name: "File Uploader",},

			{renderer: Example_Form, name: "Form - Register",},
			{renderer: Hello, name: "Hello",},
			{renderer: Example_Dialogs, name: "Dialog Examples",},
			{renderer: Example_Toaster, name: "Toaster Examples",},
			{renderer: Page_ApiGen, name: "Api Generator",},
			{renderer: Hello, name: "Live docs",},
			{renderer: Example_TriggerPush, name: "Trigger Push"},
			{renderer: Example_ApiCustomError, name: "Custom error"},
			{renderer: TreeRefactorPage, name: "Page for Tree refactoring"},

			{renderer: Example_PermissionsComponent, name: 'Permissions Component'},
			{renderer: Example_Analytics, name: 'Analytics'},
			{renderer: Example_Scatter, name: 'Scatter Plot'},
			{renderer: Example_CCgraphs, name: 'CC Graphs'}
		];
	}
}