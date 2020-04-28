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
} from "@nu-art/thunderstorm/app-frontend/components/Playground";
import {Page_ApiGen} from "./Page_ApiGen";
import {Hello} from "../Hello";
import {Example_ApiCustomError} from '../playground/Example_ApiCustomError';
import {Example_Tabs2} from "../playground/tabs/Example_Tabs2";
import {Example_GenericSelect} from "../playground/_to-be-removed/Example_GenericSelect";
import {Example_Tabs} from "../playground/tabs/Example_Tabs";
import { Example_KeyboardOnTree } from '../playground/keyboard-listener/Example_KeyboardOnTree';
import {unitStyle} from "../ui/SelectStyle";
import { Example_Dialogs } from '../playground/Example_Dialogs';
import { Example_Toaster } from '../playground/Example_Toaster';
import { Example_DropDown } from '../playground/Example_DropDown';
import { Example_Menu } from '../playground/Example_Menu';

const icon__arrowClose = require('@res/images/icon__arrowClose.svg');
const icon__arrowOpen = require('@res/images/icon__arrowOpen.svg');

export class Page_Playground extends React.Component<{}> {

	constructor(props: {}) {
		super(props);
		this.state = {};
	}

	render() {
		return <Playground selectStyle={unitStyle}
			            iconClose={icon__arrowClose}
			            iconOpen={icon__arrowOpen}
			            screens={this.getScreens()}/>
	}

	getScreens(): PlaygroundScreen[] {
		return [
			{
				name: "Hello",
				getNode: () => {
					return <Hello/>;
				}
			},
			{
				name: "Dialog Examples",
				getNode: () => {
					return <Example_Dialogs/>;
				}
			},
			{
				name: "Toaster Examples",
				getNode: () => {
					return <Example_Toaster/>;
				}
			},
			{
				name: "Api Generator",
				getNode: () => {
					return <Page_ApiGen/>;
				}
			},
			{
				name: "Live docs",
				getNode: () => {
					return <Hello/>;
				}
			},
			{
				name: "Custom error",
				getNode: () => {
					return <Example_ApiCustomError/>;
				}
			},
			{
				name: "Tabs",
				getNode: () => {
					return <Example_Tabs2/>;
				}
			},
			{
				name: "GenericTabs",
				getNode: () => {
					return <Example_Tabs/>;
				}
			},
			{
				name: "GenericSelect",
				getNode: () => {
					return <Example_GenericSelect/>;
				}
			},
			{
				name: "DropDown Examples",
				getNode: () => {
					return <Example_DropDown/>;
				}
			},
			{
				name: "Menu",
				getNode: () => {
					return <Example_Menu/>;
				}
			},
			{
				name: "Special keyboard listener",
				getNode: () => {
					return <Example_KeyboardOnTree/>;
				}
			},
		];
	}

}
