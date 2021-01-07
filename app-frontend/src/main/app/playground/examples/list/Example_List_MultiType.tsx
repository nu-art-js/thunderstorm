import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuAndButton,
	MenuComponent,
	ToastModule,
	TreeNode
} from "@intuitionrobotics/thunderstorm/frontend";
import {__stringify} from "@intuitionrobotics/ts-common";

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
			<div>
				<h2>Here is a menu and button</h2>
				<MenuAndButton
					id={'menu-and-button'}
					iconClosed={<div>^</div>}
					iconOpen={<div>*</div>}
					adapter={adapter}
				/>
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
				             reg: (props: { item: { value: string }, node: TreeNode }) => <div>{props.item}</div>,
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
				<h2>Here is a list with multiple Item Types</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>

		</div>
	}
}
