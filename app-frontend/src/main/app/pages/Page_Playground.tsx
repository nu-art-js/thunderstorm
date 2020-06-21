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
import {Page_ApiGen} from "./Page_ApiGen";
import {Hello} from "../Hello";
import {Example_ApiCustomError} from '../playground/examples/Example_ApiCustomError';
import {Example_Tabs2} from "../playground/examples/tabs/Example_Tabs2";
import {Example_GenericSelect} from "../playground/examples/_to-be-removed/Example_GenericSelect";
import {Example_Tabs} from "../playground/examples/tabs/Example_Tabs";
import {Example_Dialogs} from '../playground/examples/Example_Dialogs';
import {Example_Toaster} from '../playground/examples/Example_Toaster';
import {Example_Menu} from '../playground/examples/menu/Example_Menu';
import {Example_DropDown} from "../playground/examples/Example_DropDown";
import {Example_ErrorBoundary} from "../playground/Example_ErrorBoundary";
import {selectStyles} from "../playground/Page_Playground";

const icon__arrowClose = require('@res/images/icon__arrowClose.svg');
const icon__arrowOpen = require('@res/images/icon__arrowOpen.svg');

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
			iconClose={icon__arrowClose}
			iconOpen={icon__arrowOpen}
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
			// {
			// 	name: "Special keyboard listener",
			// 	renderer: Example_KeyboardOnTree
			// },
			{
				name: "Error boundary",
				renderer: Example_ErrorBoundary
			}
		];
	}

}