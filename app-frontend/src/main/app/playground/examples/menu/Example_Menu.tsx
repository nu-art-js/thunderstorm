import * as React from "react";
import {Component} from "react";
import {
	_Menu,
	_Renderer,
	ItemToRender,
	MenuAndButton
} from "@nu-art/thunderstorm/frontend";
import {
	_keys,
	randomObject
} from "@nu-art/ts-common";
import {ICONS} from "@res/icons";
import {SimpleMenu} from "./SimpleMenu";

type RendererString = { action?: (item: { toDisplay: string }) => void, toDisplay: string };

type Rm = {
	normal: _Renderer<RendererString>
	bold: _Renderer<RendererString>
};

const rendererMap: Rm = {
	normal: ({item: {toDisplay}}) => <div>{toDisplay}</div>,
	bold: ({item: {toDisplay}}) => <strong>{toDisplay}</strong>,
};

const menuItems = ['hi', 'bye', 'ciao', 'nice to meet', 'you'];
const menuItems1 = ["pah", "zevel", "ashpa"];

const createMenu = (): _Menu<Rm> => {
	const _children = menuItems.map(item => {
		const menuItem: ItemToRender<Rm, keyof Rm> = {
			item: {toDisplay: item},
			type: randomObject(_keys(rendererMap))
		};
		return menuItem;
	});
	const _children1 = menuItems1.map(item => {
		const menuItem: ItemToRender<Rm, keyof Rm> = {
			item: {toDisplay: item},
			type: randomObject(_keys(rendererMap))
		};
		return menuItem;
	});
	_children[2]._children = _children1;
	return {items: _children, rendererMap};
};

export class Example_Menu
	extends Component<{}> {


	render() {
		const menu = createMenu() as _Menu<any>;
		return <div>
			<div>
				<h2>Here is a Menu Button</h2>
				<MenuAndButton
					id={'menu'}
					iconClosed={ICONS.arrowClose(undefined, 14)}
					iconOpen={ICONS.arrowOpen(undefined, 14)}
					menu={menu}
				/>
			</div>

			<div>
				<h2>Here is the same menu but as a component</h2>
				TEMPORARILY DISABLED
				<SimpleMenu menu={menu}/>
			</div>
		</div>
	}
}