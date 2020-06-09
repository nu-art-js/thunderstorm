import * as React from "react";
import {Component} from "react";
import {
	FixedMenu,
	Menu,
	MenuAndButton,
	MenuItemWrapper,
	Renderer,
	TS_Input
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
	edit: Renderer<{}>
};

const rendererMap: Rm = {
	normal: ({item: {toDisplay}}) => <div>{toDisplay}</div>,
	bold: ({item: {toDisplay}}) => <strong>{toDisplay}</strong>,
	edit: () => <TS_Input type={'text'} placeholder={'Type something if you dont believe me'} onChange={(val) => console.log(val)}/>
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
	// @ts-ignore
	_children.push({type: 'edit'})
	return {_children, rendererMap};
};

export class Example_Menu
	extends Component<{}> {

	render() {
		const menu = createMenu() as Menu<any>;
		return <div>
			<div>
				Here is a Menu Button
				<MenuAndButton
					id={'menu'}
					iconClosed={iconClose}
					iconOpen={iconOpen}
					menu={menu}
				/>
			</div>

			<div>
				Here is the same menu but as a component
				<FixedMenu menu={menu}/>
			</div>
		</div>
	}
}