import * as React from "react";
import {Component} from "react";
import {MenuAndButton} from "@nu-art/thunderstorm/app-frontend/modules/menu/MenuAndButton";
import {
	Renderer,
	Menu,
	MenuItemWrapper
} from "@nu-art/thunderstorm/frontend";

const iconClose = require('@res/images/icon__arrowClose.svg');
const iconOpen = require('@res/images/icon__arrowOpen.svg');

type RendererString = { action?: (item: { toDisplay: string }) => void, toDisplay: string };

type Rm = {
	normal: Renderer<RendererString>
};

const createMenu = (): Menu<Rm> => {
	const rendererMap: Rm = {
		normal: ({item: {toDisplay}}) => <div>{toDisplay}</div>
	};
	const _children = ["hi", "bye"].map((panelId: string) => {
		const menuItem: MenuItemWrapper<Rm, 'normal'> = {
			item: {
				toDisplay: panelId,
			},
			type: "normal"
		};
		return menuItem;
	});
	return {_children, rendererMap};
};

export class MenuPlayground
	extends Component<{}> {

	render() {
		return <div>
			<MenuAndButton
				id={'menu'}
				iconClosed={() => iconClose}
				iconOpen={() => iconOpen}
				menu={createMenu() as Menu<any>}
			/>
		</div>
	}

}