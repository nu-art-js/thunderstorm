import * as React from "react";
import {Component} from "react";
import {
	Renderer,
	RendererMap,
	ItemToRender,
	MenuAndButton,
	MultiTypeAdapter,
	MenuComponent,
	stopPropagation,
	TreeRendererProps
} from "@nu-art/thunderstorm/frontend";
import {
	_keys,
	randomNumber,
	randomObject
} from "@nu-art/ts-common";
import {ICONS} from "@res/icons";

type RendererString = { action?: (item: { toDisplay: string }) => void, toDisplay: string };

type Rm = {
	normal: Renderer<RendererString>
	bold: Renderer<RendererString>
};

const rendererMap: Rm = {
	normal: ({item: {toDisplay}}) => <div>{toDisplay}</div>,
	bold: ({item: {toDisplay}}) => <strong>{toDisplay}</strong>,
};

const menuItems = ['hi', 'bye', 'ciao', 'nice to meet', 'you'];
const menuItems1 = ["pah", "zevel", "ashpa"];

const submenuPosition = randomNumber(menuItems.length);
const items = menuItems.map((item, idx) => {
	const menuItem: ItemToRender<Rm> = {
		item: {toDisplay: item},
		type: randomObject(_keys(rendererMap))
	};
	if (idx === submenuPosition) {
		menuItem._children = menuItems1.map((item): ItemToRender<Rm> => {
			return {
				item: {toDisplay: item},
				type: randomObject(_keys(rendererMap))
			}
		})
	}
	return menuItem;
});

export class Example_Menu
	extends Component<{}> {


	render() {
		const adapter: MultiTypeAdapter<RendererMap> = new MultiTypeAdapter(items, rendererMap);

		adapter.treeNodeRenderer = NodeRenderer;

		return <div>
			<div>
				<h2>Here is a Menu Button</h2>
				<MenuAndButton
					id={'menu-and-button'}
					iconClosed={ICONS.arrowClose(undefined, 14)}
					iconOpen={ICONS.arrowOpen(undefined, 14)}
					adapter={adapter}
				/>
			</div>

			<div>
				<h2>Here is the same menu but as a component</h2>
				<MenuComponent adapter={adapter}/>
			</div>
		</div>
	}
}

class NodeRenderer
	extends React.Component<TreeRendererProps> {

	constructor(props: TreeRendererProps) {
		super(props);
	}

	render() {
		const item = this.props.item.item;
		const Renderer = this.props.node.adapter.resolveRenderer(this.props.item.type);
		if (!Renderer)
			return "";

		const hasChildren = Array.isArray(this.props.item) && this.props.item.length > 0;

		return (
			<div
				className="ll_h_c clickable"
				id={this.props.node.path}
				onClick={this.props.node.onClick}
			>
				<Renderer node={this.props.node} item={item}/>
				{hasChildren && <div
					id={this.props.node.path}
					onMouseDown={stopPropagation}
					onMouseUp={(e) => this.props.node.expandToggler(e, !this.props.node.expanded)}
					style={{cursor: "pointer", marginRight: 10}}
				>{this.props.node.expanded ? "+" : "-"}</div>}
			</div>
		);
	};
}

