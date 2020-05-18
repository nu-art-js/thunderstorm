import * as React from "react";
import {Component} from "react";
import {MenuAndButton} from "@nu-art/thunderstorm/frontend";
import {
	Menu,
	MenuItemWrapper,
	Renderer
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
		return <div>
			<MenuAndButton
				id={'menu'}
				iconClosed={iconClose}
				iconOpen={iconOpen}
				menu={createMenu() as Menu<any>}
			/>
		</div>
	}
}