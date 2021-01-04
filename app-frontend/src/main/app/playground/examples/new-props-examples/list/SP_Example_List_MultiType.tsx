import * as React from "react";
import {Component} from "react";
import {
	AdapterBuilder,
	Example_NewProps,
	MenuComponent,
	MenuComponentProps,
	ToastModule
} from "@ir/thunderstorm/frontend";
import {__stringify} from "@ir/ts-common";

export class SP_Example_List_MultiType
	extends Component<{}> {
	private data: any;
	private complexData: any;
	private rendererMap: any;

	constructor(props: {}) {
		super(props);
		this.data = [{type: "reg", item: 'hi'},
			{type: "reg", item: 'bye'},
			{type: "reg", item: 'ciao'},
			{type: "bold", item: 'nice to meet'},
			{type: "reg", item: 'you'},
		];

		this.complexData = [
			{type: "reg", item: 'No hi'},
			{type: "reg", item: 'No bye'},
			{type: "reg", item: 'No ciao'},
			{type: "bold", item: 'No nice to meet'},
			{type: "reg", item: 'No you'},
		];

		this.rendererMap = {
			reg: (_props: { item: string }) => <div>{_props.item}</div>,
			bold: (_props: { item: string }) => <div><b>{_props.item}</b></div>
		};
	}

	render() {
		return <div>
			<div>
				<h2>Here is a nested list with multiple Item Types</h2>
				<Example_NewProps name={"MenuComponent"} renderer={MenuComponent} data={[this.simpleAdapterProps(), this.complexAdapterProps()]}/>
			</div>
		</div>
	}

	private simpleAdapterProps() {
		return {
			id: "simple",
			key: "simple",
			adapter: AdapterBuilder()
				.list()
				.multiRender(this.rendererMap)
				.setData(this.data)
				.build(),
			onNodeClicked: (path: string, item: any) => {
				ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)
			}
		} as MenuComponentProps & { key: string };
	}

	private complexAdapterProps() {
		return {
			id: "complex",
			key: "complex",
			adapter: AdapterBuilder()
				.list()
				.multiRender(this.rendererMap)
				.setData(this.complexData)
				.build(),
			onNodeClicked: (path: string, item: any) => {
				ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)
			}
		} as MenuComponentProps & { key: string };
	}


}

