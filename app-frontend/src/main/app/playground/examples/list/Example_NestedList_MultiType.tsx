import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuComponent,
	ToastModule
} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";

export class Example_NestedList_MultiType
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.multiRender({
				             reg: (props: { item: string }) => <div>{props.item}</div>,
				             bold: (props: { item: string }) => <div><b>{props.item}</b></div>
			             })
			.nested()
			.setData([{type: "reg", item: 'hi'},
				         {type: "reg", item: 'bye'},
				         {type: "reg", item: 'ciao'},
				         {
					         type: "bold", item: 'submenu1',
					         _children: [
						         {type: "bold", item: 'Pah'},
						         {type: "reg", item: 'Mallle'},
						         {type: "bold", item: 'ZEVEL'},
						         {
							         type: "bold", item: 'submenu2',
							         _children: [
								         {type: "bold", item: 'Pah'},
								         {type: "reg", item: 'Mallle'},
								         {type: "bold", item: 'ZEVEL'},
								         {
									         type: "bold", item: 'submenu3',
									         _children: [
										         {type: "bold", item: 'Pah'},
										         {type: "reg", item: 'Mallle'},
										         {type: "bold", item: 'ZEVEL'}]
								         },]
						         },]
				         },
				         {type: "reg", item: 'you'},
			         ])
			.build()


		return <div>
			<div>
				<h2>Here is a simple list with multiple Item Types</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}
