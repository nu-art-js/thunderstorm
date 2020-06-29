import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuComponent,
	ToastModule,
	TreeNode,
	DropDown
} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";
import {
	Plague,
	plagues
} from "../dropdown/Example_DropDowns";

export class Example_List_MultiType
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.multiRender({
				             reg: (props: { item: string }) => <div>{props.item}</div>,
				             bold: (props: { item: string }) => <div><b>{props.item}</b></div>
			             })
			.setData([{type: "reg", item: 'hi'},
				         {type: "reg", item: 'bye'},
				         {type: "reg", item: 'ciao'},
				         {type: "bold", item: 'nice to meet'},
				         {type: "reg", item: 'you'},
			         ])
			.build()


		return <div>
			<div>
				<h2>Here is a nested list with multiple Item Types</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}

export class Example_List_MultiType1
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.multiRender({
				             reg: (props: { item: { value: string } }) => <div>{props.item}</div>,
				             bold: (props: { item: { value: string } }) => <div><b>{props.item}</b></div>
			             })
			.setData([{type: "reg", item: {value: 'hi'}},
				         {type: "reg", item: {value: 'bye'}},
				         {type: "reg", item: {value: 'ciao'}},
				         {type: "bold", item: {value: 'nice to meet'}},
				         {type: "reg", item: {value: 'you'}},
			         ])
			.build()


		return <div>
			<div>
				<h2>Here is a nested list with multiple Item Types</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}
