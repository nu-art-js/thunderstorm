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
import {Example_KeyboardOnTree} from './examples/keyboard-listener/Example_KeyboardOnTree';
import {Example_Dialogs} from './examples/Example_Dialogs';
import {Example_Toaster} from './examples/Example_Toaster';
import {Example_Menu} from './examples/Example_Menu';
import {Example_DropDown} from "./examples/Example_DropDown";
import {TreeRefactorPage} from "./examples/_to-be-removed/TreeRefactorPage";
import {ICONS} from "@res/icons";
import {COLORS} from "@res/colors";

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
			{
				name: "Hello",
				renderer: Hello
			},
			{
				name: "Dialog Examples",
				renderer: Example_Dialogs
			},
			{
				name: "Toaster Examples",
				renderer: Example_Toaster
			},
			{
				name: "Api Generator",
				renderer: Page_ApiGen
			},
			{
				name: "Live docs",
				renderer: Hello
			},
			{
				name: "Custom error",
				renderer: Example_ApiCustomError
			},
			{
				name: "Tabs",
				renderer: Example_Tabs2
			},
			{
				name: "GenericTabs",
				renderer: Example_Tabs
			},
			{
				name: "GenericSelect",
				renderer: Example_GenericSelect
			},
			{
				name: "DropDown Examples",
				renderer: Example_DropDown
			},
			{
				name: "Menu",
				renderer: Example_Menu
			},
			{
				name: "Special keyboard listener",
				renderer: Example_KeyboardOnTree
			},
			{
				name: "Page for Tree refactoring",
				renderer: TreeRefactorPage
			}
		];
	}

}