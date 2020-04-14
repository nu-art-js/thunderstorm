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
import {Page_DialogExamples} from "./Page_DialogExamples";
import {Page_ToasterExample} from "./Page_ToasterExample";
import {Page_ApiGen} from "./Page_ApiGen";
import {Hello} from "../Hello";
import {CustomErrorExample} from './CustomErrorExample';
import {unitStyle} from "../ui/SelectStyle";
import {
	Playground,
	PlaygroundScreen
} from "@nu-art/thunderstorm/app-frontend/components/Playground";
import {TabsPlayground} from "./TabsPlayground";
import {GenericSelectPlayground} from "./GenericSelectPlayground";
import {GenericTabsPlayground} from "./GenericTabsPlayground";
import { Page_DropDownExamples } from './Page_DropDownExamples';

const icon__arrowClose = require('@res/images/icon__arrowClose.svg');
const icon__arrowOpen = require('@res/images/icon__arrowOpen.svg');

export class SamplePlayground extends React.Component<{}> {

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
					return <Page_DialogExamples/>;
				}
			},
			{
				name: "Toaster Examples",
				getNode: () => {
					return <Page_ToasterExample/>;
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
					return <CustomErrorExample/>;
				}
			},
			{
				name: "Tabs",
				getNode: () => {
					return <TabsPlayground/>;
				}
			},
			{
				name: "GenericTabs",
				getNode: () => {
					return <GenericTabsPlayground/>;
				}
			},
			{
				name: "GenericSelect",
				getNode: () => {
					return <GenericSelectPlayground/>;
				}
			},
			{
				name: "DropDown Examples",
				getNode: () => {
					return <Page_DropDownExamples/>;
				}
			},
		];
	}

}
