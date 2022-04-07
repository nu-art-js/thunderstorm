import * as React from 'react';
import {Component} from 'react';
import {Adapter, SimpleTreeAdapter, ToastModule, TS_Tree} from '@nu-art/thunderstorm/frontend';
import {__stringify, deepClone} from '@nu-art/ts-common';

type Type = {
	label: string | number
	other: string
};

export class Example_Tree_SingleType
	extends Component<{}> {
	static index = 0;
	private data: any;

	constructor(props: {}) {
		super(props);
		this.data = {
			First: {
				label: 'First element',
				other: 'Other element',
			},
			Second: {
				zevel: {
					data: {
						label: 'Second element',
						other: 'Other element',
					},

					label: 'Second element',
					other: 'Other element',
				},
				data: {
					ashpa: {
						label: 'Second element',
						other: 'Other element',
					},

					label: 'Second element',
					other: 'Other element',
				}
			},
			Third: {
				label: 8,
				other: 'Other element',
			},
			Forth: {
				label: 'Forth element',
				other: 'Other element',
			}
		};
	}

	render() {
		const adapter: Adapter = SimpleTreeAdapter(this.data, (props: { item: Type }) => <div>{props.item}</div>);
		// adapter.adjust = adapter.adjustNodes("data")
		return <div>
			<div>
				<h2>Here is a tree with one renderer Type</h2>
				<div onClick={() => this.addItem('First')}>Add First</div>
				<div onClick={() => this.addItem('Second')}>Add Second</div>
				<div onClick={() => this.addItem('Third')}>Add Third</div>
				<div onClick={() => this.addItem('Forth')}>Add Forth</div>
				<TS_Tree
					adapter={adapter}
					onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>;
	}

	private addItem = (path: string) => {
		this.data[`${path}_${Example_Tree_SingleType.index++}`] = deepClone(this.data[path]);
		this.forceUpdate();
	};
}


