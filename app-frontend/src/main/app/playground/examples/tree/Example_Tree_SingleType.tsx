import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuComponent,
	ToastModule
} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";

export class Example_Tree_SingleType
	extends Component<{}> {

	render() {
		const adapter: Adapter = AdapterBuilder()
			.tree()
			.singleRender((props: { item: { label: string | number, other: string } }) => <div>{props.item}</div>)
			.setData({
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
					         label: "Forth element",
					         other: 'Other element',
				         }
			         })
			.build()


		return <div>
			<div>
				<h2>Here is a tree with one renderer Type</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}


