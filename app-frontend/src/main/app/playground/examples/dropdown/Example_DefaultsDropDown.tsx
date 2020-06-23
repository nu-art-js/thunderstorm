/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {Adapter} from "@nu-art/thunderstorm/app-frontend/components/tree/Adapter";
import {DropDown} from "@nu-art/thunderstorm/app-frontend/components/DropDown";
import * as React from "react";
import {
	ItemRenderer,
	Plague,
	plagues
} from "./Example_DropDowns";

export class Example_DefaultsDropDown
extends React.Component<{}, { _selected: string }> {

	state = {_selected: ''};

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};

	render() {
		const simpleAdapter = new Adapter<Plague>().setData(plagues).setTreeNodeRenderer(ItemRenderer);
		simpleAdapter.hideRoot = true;
		return <div>
			<h4>Only defaults, single renderer</h4>
			<h4>single renderer</h4>
			<DropDown
				adapter={simpleAdapter}
				onSelected={this.onSelected}
			/>
		</div>
	}
}