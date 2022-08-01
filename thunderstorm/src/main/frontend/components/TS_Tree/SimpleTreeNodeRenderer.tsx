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

import * as React from 'react';
import {BaseNodeRenderer, NodeRendererProps} from '../adapter/BaseRenderer';

export class SimpleTreeNodeRenderer
	extends BaseNodeRenderer<any> {

	renderCollapse() {
		let toDisplay;
		if (typeof this.props.item !== 'object')
			toDisplay = '';
		else if (Object.keys(this.props.item).length === 0)
			toDisplay = '';
		else if (this.props.node.expanded)
			toDisplay = '-';
		else
			toDisplay = '+';

		return <div
			className={`clickable`}
			style={{width: '15px'}}>
			{toDisplay}
		</div>;
	}

	protected renderItem(item: any): React.ReactNode {
		return (<div className="ll_h_c">
			{this.renderCollapse()}
			<SimpleNodeRenderer {...this.props}/>
		</div>);
	}
}


export class SimpleNodeRenderer
	extends React.Component<NodeRendererProps> {

	render() {
		let label;
		const item = this.props.item;
		if (typeof item !== 'object')
			label = ` : ${item}`;
		else if (Object.keys(item).length === 0)
			label = ' : {}';
		else
			label = '';

		return ('propKey' || 'root') + label;
	}
}