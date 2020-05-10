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

import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import * as React from "react";
import {LiveDocsModule} from "../modules/LiveDocsModule";

type State = {
	edit?: boolean
}

type Props = {
	docKey: string;
	component?: React.ReactNode;
	duration?: number;
}


const showLiveDoc = (e: React.MouseEvent) => {
	const docKey = BaseComponent.getElementId(e);
	LiveDocsModule.showLiveDoc(docKey);
};

export class LiveDoc
	extends React.Component<Props, State> {

	static defaultProps = {
		component: "?"
	};

	constructor(props: Props) {
		super(props);
		this.state = {};
	}


	render() {
		const Component = this.props.component;

		return (
			<div className={`clickable`} id={this.props.docKey} style={{display: "inline-block"}} onClick={showLiveDoc}>
				{Component || "Click Here"}
			</div>
		);
	}
}
