import * as React from "react";
import {Component} from "react";
import {
	Adapter,
	AdapterBuilder,
	MenuComponent,
	ToastModule,
	_BaseNodeRenderer,
	NodeRendererProps
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


export class Example_NestedList_MultiType_Object
	extends Component<{}> {

	render() {
		let rendererMap = {
			reg: (props: { item: { label: string } }) => <div>{`Label: ${props.item.label}`}</div>,
			bold: (props: { item: { stam: number } }) => <div><b>{`Number: ${props.item.stam}`}</b></div>
		};
		const adapter: Adapter = AdapterBuilder()
			.list()
			.multiRender(rendererMap)
			.nested()
			.setData([{type: "reg", item: {label: 'hi'}},
				         {type: "reg", item: {label: 'bye'}},
				         {type: "reg", item: {label: 'ciao'}},
				         {
					         type: "bold", item: {stam: 42},
					         _children: [
						         {type: "bold", item: {stam: 42}},
						         {type: "reg", item: {label: 'Mallle'}},
						         {type: "bold", item: {stam: 42}},
						         {
							         type: "bold", item: {stam: 42},
							         _children: [
								         {type: "bold", item: {stam: 42}},
								         {type: "reg", item: {label: 'Mallle'}},
								         {type: "bold", item: {stam: 42}},
								         {
									         type: "bold", item: {stam: 42},
									         _children: [
										         {type: "bold", item: {stam: 42}},
										         {type: "reg", item: {label: 'Mallle'}},
										         {type: "bold", item: {stam: 42}}]
								         },]
						         },]
				         },
				         {type: "reg", item: {label: 'you'}},
			         ])
			.build().setTreeNodeRenderer((props: NodeRendererProps) => {
				                             if (props.node.propKey === "_children")
					                             return null;

				                             // @ts-ignore
				                             const _Renderer: _BaseNodeRenderer<any> = rendererMap[props.item.type];
				                             return <div id={props.node.path} onClick={props.node.onClick}>
					                             <_Renderer item={props.item.item} node={props.node}/>
				                             </div>;
			                             }
			)


		return <div>
			<div>
				<h2>Here is a simple list with multiple Item Types</h2>
				<MenuComponent adapter={adapter} onNodeClicked={(path: string, item: any) => ToastModule.toastInfo(`clicked on ${path}: ${__stringify(item)}`)}/>
			</div>
		</div>
	}
}
