import * as React from 'react';
import {Component} from 'react';
import {Adapter, MenuComponent, SimpleListAdapter, ToastModule} from '@nu-art/thunderstorm/frontend';
import {__stringify} from '@nu-art/ts-common';

export class Example_List_SingleType
	extends Component<{}> {

	render() {
		const adapter: Adapter = SimpleListAdapter(['hi', 'bye', 'ciao', 'nice to meet', 'you'], (props: { item: string }) => <div>{props.item}</div>);
		return <div>
			<div>
				<h2>Here is a simple list with one Item Type</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>;
	}
}

export class Example_List_SingleObjectType
	extends Component<{}> {

	render() {
		const adapter: Adapter = SimpleListAdapter([{price: 'hi'}, {price: 'bye'}, {price: 'ciao'}, {price: 'nice to meet'}, {price: 'you'}], (props: { item: { price: string } }) =>
			<div>{props.item.price}</div>);
		return <div>
			<div>
				<h2>Here is a simple list with one Item as object Type</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>;
	}
}

