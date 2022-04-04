import * as React from 'react';
import {Component} from 'react';
import {Example_NewProps, MenuComponent, MenuComponentProps, SimpleListAdapter, ToastModule} from '@nu-art/thunderstorm/frontend';
import {__stringify} from '@nu-art/ts-common';

export class SP_Example_List_SingleType
	extends Component<{}> {
	private data: any;
	private complexData: any;

	constructor(props: {}) {
		super(props);
		this.data = ['hi', 'bye', 'ciao', 'nice to meet', 'you'];
		this.complexData = ['No hi', 'No bye', 'No ciao', 'No nice to meet', 'No you'];
	}

	render() {
		return <div>
			<div>
				<h2>Here is a simple list with one Item Type</h2>
				<Example_NewProps name={'MenuComponent'} renderer={MenuComponent} data={[this.simpleAdapterProps(), this.complexAdapterProps()]}/>
			</div>
		</div>;
	}

	private simpleAdapterProps() {
		return {
			id: 'simple',
			key: 'simple',
			adapter: SimpleListAdapter(this.data, (props: { item: string }) => <div>{props.item}</div>),
			onNodeClicked: (path: string, item: any) => {
				ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`);
			}
		} as MenuComponentProps & { key: string };
	}

	private complexAdapterProps() {
		return {
			id: 'complex',
			key: 'complex',
			adapter: SimpleListAdapter(this.complexData, (props: { item: string }) => <div>{props.item}</div>),
			onNodeClicked: (path: string, item: any) => {
				ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`);
			}
		} as MenuComponentProps & { key: string };
	}

}



