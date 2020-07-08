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
import {
	Playground,
	PlaygroundScreen
} from "@nu-art/thunderstorm/frontend";
import {Page_ApiGen} from "../pages/Page_ApiGen";
import {Hello} from "../Hello";
import {Example_ApiCustomError} from './examples/Example_ApiCustomError';
import {Example_Tabs2} from "./examples/tabs/Example_Tabs2";
import {Example_GenericSelect} from "./examples/_to-be-removed/Example_GenericSelect";
import {Example_Tabs} from "./examples/tabs/Example_Tabs";
import {Example_VerySimpleTree} from './examples/keyboard-listener/Example_VerySimpleTree';
import {Example_Dialogs} from './examples/Example_Dialogs';
import {Example_Toaster} from './examples/Example_Toaster';
// import {Example_Menu} from './examples/menu/Example_Menu';
import {TreeRefactorPage} from "./examples/_to-be-removed/TreeRefactorPage";
import {ICONS} from "@res/icons";
import {COLORS} from "@res/colors";
import {Example_Form} from "./examples/Example_Form";
import {Example_TriggerPush} from "./examples/Example_TriggerPush";
import {Example_DropDowns} from "./examples/dropdown/Example_DropDowns";
import {Example_DefaultsDropDown} from "./examples/dropdown/Example_DefaultsDropDown";
import {Example_SingleRendererDropDown} from "./examples/dropdown/Example_SingleRendererDropDown";
import {Example_MultiRendererDropDown} from "./examples/dropdown/Example_MultiRendererDropDown";
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
import {OstudioEx} from "./examples/dropdown/OstudioEx";

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
		/>
	}

	getScreens(): PlaygroundScreen[] {
		return [
			{renderer: Example_Tree_SingleType, name: "Tree_SingleType",},
			{renderer: Example_List_SingleType, name: "List_SingleType_Menu",},
			{renderer: Example_NestedList_SingleType, name: "List_SingleType_NestedMenu",},
			{renderer: Example_List_MultiType, name: "List_MultiType_Menu",},
			{renderer: Example_NestedList_MultiType, name: "NestedList_MultiType",},
			{renderer: Example_NestedList_MultiType_Object, name: "NestedList_MultiType_Object",},
			{renderer: Example_NestedList_MultiType_Object_Dynamic, name: "NestedList_MultiType_Object_Dynamic",},
			{renderer: Example_List_All, name: "Example_List_All",},

			{renderer: Example_Form, name: "Form - Register",},
			{renderer: Hello, name: "Hello",},
			{renderer: Example_Dialogs, name: "Dialog Examples",},
			{renderer: Example_Toaster, name: "Toaster Examples",},
			{renderer: Page_ApiGen, name: "Api Generator",},
			{renderer: Hello, name: "Live docs",},
			{renderer: Example_TriggerPush, name: "Trigger Push"},
			{renderer: Example_ApiCustomError, name: "Custom error"},
			{renderer: Example_Tabs2, name: "Tabs",},
			{renderer: Example_Tabs, name: "GenericTabs",},
			{renderer: Example_GenericSelect, name: "GenericSelect",},
			{renderer: Example_DropDowns, name: "DropDown Examples"},
			{renderer: Example_DefaultsDropDown, name: "Defaults Single Renderer DropDown Example"},
			{renderer: Example_SingleRendererDropDown, name: "Customized Single Renderer DropDown Example"},
			{renderer: Example_MultiRendererDropDown, name: "Customized Multiple Renderers DropDown Example"},
			// {renderer: Example_Menu, name: "Menu",},
			{renderer: Example_VerySimpleTree, name: "Special keyboard listener"},
			{renderer: TreeRefactorPage, name: "Page for Tree refactoring"},
			{renderer: OstudioEx, name: 'stam'}
		];
	}
}