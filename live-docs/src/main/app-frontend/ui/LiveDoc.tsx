/*
 * Live-Docs will allow you to add and edit tool-tips from within your app...
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
import {ModuleFE_LiveDocs} from '../modules/ModuleFE_LiveDocs';


type State = {
	edit?: boolean
}

type Props = {
	docKey: string;
	component?: React.ReactNode;
	duration?: number;
}

const showLiveDoc = (e: React.MouseEvent) => {
	const key = (e.currentTarget as HTMLElement).id;
	ModuleFE_LiveDocs.v1.get({key}).execute();
};

export class LiveDoc
	extends React.Component<Props, State> {

	static defaultProps = {
		component: '?'
	};

	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	render() {
		const Component = this.props.component;

		return (
			<div className={`clickable`} id={this.props.docKey} style={{display: 'inline-block'}} onClick={showLiveDoc}>
				{Component || 'Click Here'}
			</div>
		);
	}
}
