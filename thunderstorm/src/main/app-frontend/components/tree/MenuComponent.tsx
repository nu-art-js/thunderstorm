/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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
import {generateHex} from "@ir/ts-common";
import {BaseComponent} from "../../core/BaseComponent";
import {Adapter} from "../adapter/Adapter";
import {Tree} from "./Tree";

export type MenuComponentProps = {
	adapter: Adapter
	childrenContainerStyle?: any
	onNodeClicked?: (path:string,item:any) => void
	onNodeDoubleClicked?: Function // TODO: Need to handle this
	id?: string
}

export class MenuComponent
	extends BaseComponent<MenuComponentProps> {
	private readonly id: string;

	constructor(props: MenuComponentProps) {
		super(props);
		this.id = this.props.id || generateHex(8);
	}

	render() {
		return <Tree
			id={this.id}
			adapter={this.props.adapter}
			onNodeClicked={this.props.onNodeClicked}
		/>
	}
}