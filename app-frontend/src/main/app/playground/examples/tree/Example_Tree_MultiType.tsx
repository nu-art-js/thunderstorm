import * as React from 'react';
import {Component} from 'react';
import {Adapter, AdapterBuilder, NodeRendererProps, ModuleFE_Toaster, TS_Tree} from '@nu-art/thunderstorm/frontend';
import {__stringify} from '@nu-art/ts-common';

export class Example_Tree_MultiType_Renderer
	extends Component<{}> {
	static index = 0;

	constructor(props: {}) {
		super(props);
	}

	render() {
		const data = [{
			type: 'type1',
			item: 'this is a Parent',
			_children: [{
				type: 'type1',
				item: 'This is not a Parent'
			}, {
				type: 'type2',
				item: 'This is not a Parent'
			}]
		}];
		const adapter: Adapter = AdapterBuilder()
			.tree()
			.multiRender({
				type1: (props: NodeRendererProps) => <div>{props.item}</div>,
				type2: (props: NodeRendererProps) => <div style={{backgroundColor: 'red'}}>{props.item}</div>
			}).tree()
			.setData(data as any)
			.build();

		// adapter.adjust = adapter.adjustNodes("data")
		return <div>
			<div>
				<h2>Here is a tree with one renderer Type</h2>
				<TS_Tree
					adapter={adapter}
					onNodeClicked={(path: string, item: any) => ModuleFE_Toaster.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>;
	}
}

export const Example_Tree_MultiType = {renderer: Example_Tree_MultiType_Renderer, name: 'Tree_MultiType'};