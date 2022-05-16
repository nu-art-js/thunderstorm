import * as React from 'react';
import {Component} from 'react';
import {Example_NewProps, Props_Tree, SimpleTreeAdapter, ToastModule, TS_Tree,} from '@nu-art/thunderstorm/frontend';
import {__stringify} from '@nu-art/ts-common';

type Type = {
	label: string | number
	other: string
};

class SP_Example_Tree_SingleType_Renderer
	extends Component<{}> {
	private data: any;
	private complexData: any;

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
					zevel: {
						data: {
							label: 'Second element',
							other: 'Other element',
						},
					}
				},
				data: {
					data: {
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

		this.complexData = {
			Complex1: {
				label: 'Complex1 element',
				other: 'Other element',
			},
			Complex2: {
				zevelOfComplex2: {
					data: {
						label: 'Complex2 element',
						other: 'Other element',
					},

					label: 'Second element',
					other: 'Other element',
					zevel: {
						data: {
							label: 'Second element',
							other: 'Other element',
						},
					}
				},
				data: {
					data: {
						label: 'Second element',
						other: 'Other element',
					},

					label: 'Second element',
					other: 'Other element',
				}
			}
		};
	}

	render() {
		return <div>
			<div>
				<h2>Here is a tree with one renderer Type</h2>
				<div onClick={() => this.addItem('First')}>Add First</div>
				<div onClick={() => this.addItem('Second')}>Add Second</div>
				<div onClick={() => this.addItem('Third')}>Add Third</div>
				<div onClick={() => this.addItem('Forth')}>Add Forth</div>
				<Example_NewProps name={'Tree'} renderer={TS_Tree} data={[this.simpleAdapterProps(), this.complexAdapterProps()]}/>
			</div>
		</div>;
	}

	private addItem = (path: string) => {
		this.data[`${path}_copy`] = this.data[path];
		this.forceUpdate();
	};

	private simpleAdapterProps() {
		return {
			id: 'simple',
			key: 'simple',
			adapter: SimpleTreeAdapter(this.data, (props: { item: Type }) => <div>{props.item}</div>),
			onNodeClicked: (path: string, item: any) => {
				ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`);
			}
		} as Props_Tree & { key: string };
	}

	private complexAdapterProps() {
		return {
			id: 'simple',
			key: 'simple',
			adapter: SimpleTreeAdapter(this.complexData, (props: { item: Type }) => <div>{props.item}</div>),
			onNodeClicked: (path: string, item: any) => {
				ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`);
			}
		} as Props_Tree & { key: string };
	}
}

export const SP_Example_Tree_SingleType = {renderer: SP_Example_Tree_SingleType_Renderer, name: 'SP_Example_Tree_SingleType'}



