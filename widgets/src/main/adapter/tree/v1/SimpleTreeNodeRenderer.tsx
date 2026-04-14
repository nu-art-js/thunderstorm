import * as React from 'react';
import {BaseNodeRenderer, NodeRendererProps} from '../../BaseRenderer.js';

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

		return ('propKey') + label;
	}
}
