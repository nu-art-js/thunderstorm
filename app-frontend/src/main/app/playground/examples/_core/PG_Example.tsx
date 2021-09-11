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
import {ErrorBoundary} from "@nu-art/thunderstorm/frontend";
import {PlaygroundExample_BodyStyle, PlaygroundExample_ExampleStyle, PlaygroundExample_HeaderStyle} from "../consts";

export class PG_Example
	extends React.Component<{ name: string }> {

	constructor(p: { name: string }) {
		super(p);
	}

	render() {
		return (
			<div {...PlaygroundExample_BodyStyle} {...PlaygroundExample_ExampleStyle}>
				<div {...PlaygroundExample_HeaderStyle}>{this.props.name}</div>
				<ErrorBoundary>
					{this.props.children}
				</ErrorBoundary>
			</div>
		)
	}
}

