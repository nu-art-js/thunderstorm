import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuComponent,
	ToastModule
} from "@intuitionrobotics/thunderstorm/frontend";
import {__stringify} from "@intuitionrobotics/ts-common";

export class Example_List_SingleType
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.singleRender((props: { item: string }) => <div>{props.item}</div>)
			.setData(['hi', 'bye', 'ciao', 'nice to meet', 'you'])
			.build()


		return <div>
			<div>
				<h2>Here is a simple list with one Item Type</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}

export class Example_List_SingleObjectType
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.singleRender((props: { item: { price: string } }) => <div>{props.item.price}</div>)
			.setData([{price: 'hi'}, {price: 'bye'}, {price: 'ciao'}, {price: 'nice to meet'}, {price: 'you'}])
			.build()


		return <div>
			<div>
				<h2>Here is a simple list with one Item as object Type</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}

