import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuComponent,
	ToastModule
} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";

export class Example_NestedList_SingleType
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.list()
			.singleRender((props: { item: string }) => <div>{props.item}</div>)
			.nested()
			.setData(['hi',
			          'bye',
				         {
					         item: 'ciao',
					         _children: ["pah", "zevel", "ashpa"]
				         },
				        'nice to meet',
				        'you'])
			.build()


		return <div>
			<div>
				<h2>Here is a nested list with one Item Type</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}
