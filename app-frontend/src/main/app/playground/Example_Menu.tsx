import * as React from "react";
import {Component} from "react";
import {
	Menu,
	MenuAndButton,
	MenuItemWrapper,
	Renderer,
	FixedMenu
} from "@nu-art/thunderstorm/frontend";
import {
	_keys,
	randomObject
} from "@nu-art/ts-common";

const iconClose = require('@res/images/icon__arrowClose.svg');
const iconOpen = require('@res/images/icon__arrowOpen.svg');

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

const createMenu = (): Menu<Rm> => {
	const _children = menuItems.map(item => {
		const menuItem: MenuItemWrapper<Rm, keyof Rm> = {
			item: {toDisplay: item},
			type: randomObject(_keys(rendererMap))
		};
		return menuItem;
	});
	return {_children, rendererMap};
};

export class Example_Menu
	extends Component<{}> {

	render() {
		const menu = createMenu() as Menu<any>;
		return <div>
			<div>
				<h2>Here is a Menu Button</h2>
			<MenuAndButton
				id={'menu'}
				iconClosed={iconClose}
				iconOpen={iconOpen}
				menu={menu}
			/>
			</div>

			<div>
				<h2>Here is the same menu but as a component</h2>
				<FixedMenu menu={menu}/>
			</div>
		</div>
	}
}