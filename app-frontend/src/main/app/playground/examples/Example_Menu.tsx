import * as React from "react";
import {Component} from "react";
import {
	FixedMenu,
	Menu,
	MenuAndButton,
	MenuItemWrapper,
	Renderer,
<<<<<<< HEAD:app-frontend/src/main/app/playground/Example_Menu.tsx
	TS_Input
=======
	MultiTypeTree
>>>>>>> staging:app-frontend/src/main/app/playground/examples/Example_Menu.tsx
} from "@nu-art/thunderstorm/frontend";
import {
	_keys,
	randomObject
} from "@nu-art/ts-common";
import {ICONS} from "@res/icons";


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
const menuItems1 = ["pah", "zevel", "ashpa"];

const createMenu = (): Menu<Rm> => {
	const _children = menuItems.map(item => {
		const menuItem: MenuItemWrapper<Rm, keyof Rm> = {
			item: {toDisplay: item},
			type: randomObject(_keys(rendererMap))
		};
		return menuItem;
	});
<<<<<<< HEAD:app-frontend/src/main/app/playground/Example_Menu.tsx
	// @ts-ignore
	_children.push({type: 'edit'})
=======
	const _children1 = menuItems1.map(item => {
		const menuItem: MenuItemWrapper<Rm, keyof Rm> = {
			item: {toDisplay: item},
			type: randomObject(_keys(rendererMap))
		};
		return menuItem;
	});
	_children[2]._children = _children1;
>>>>>>> staging:app-frontend/src/main/app/playground/examples/Example_Menu.tsx
	return {_children, rendererMap};
};

export class Example_Menu
	extends Component<{}> {

	render() {
		const menu = createMenu() as Menu<any>;
		return <div>
			<div>
<<<<<<< HEAD:app-frontend/src/main/app/playground/Example_Menu.tsx
				Here is a Menu Button
				<MenuAndButton
					id={'menu'}
					iconClosed={iconClose}
					iconOpen={iconOpen}
=======
				<h2>Here is a Menu Button</h2>
				<MenuAndButton
					id={'menu'}
					iconClosed={ICONS.arrowClose(undefined, 14)}
					iconOpen={ICONS.arrowOpen(undefined, 14)}
>>>>>>> staging:app-frontend/src/main/app/playground/examples/Example_Menu.tsx
					menu={menu}
				/>
			</div>

			<div>
				<h2>Here is the same menu but as a component</h2>
				<MultiTypeTree menu={menu} root={menu}/>
			</div>
		</div>
	}
}