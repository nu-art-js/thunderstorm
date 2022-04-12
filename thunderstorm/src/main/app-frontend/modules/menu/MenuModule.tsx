import {generateHex, Module} from '@nu-art/ts-common';
import {MenuPosition} from './TS_PopupMenu';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {_GenericRenderer, Adapter,} from '../../components/adapter/Adapter';
import {BaseRendererMap} from '../../components/adapter/BaseRenderer';
import {CSSProperties} from 'react';

export const resolveRealPosition = (button: HTMLImageElement): MenuPosition => {
	const pos = button.getBoundingClientRect();
	return {top: pos.top + button.offsetHeight, left: pos.left};
};

export type _Menu<Rm extends BaseRendererMap<any>> = _GenericRenderer<Rm>

export type Menu_Model = {
	id: string
	adapter: Adapter,
	pos: MenuPosition,
	onNodeClicked?: (path: string, item: any) => void
	onNodeDoubleClicked?: Function,
	css?: CSSProperties
};

export interface MenuListener {
	__onMenuDisplay: (menu: Menu_Model) => void;
	__onMenuHide: (id: string) => void;
}


export class MenuModule_Class
	extends Module<{}> {

	private showMenu = new ThunderDispatcher<MenuListener, '__onMenuDisplay'>('__onMenuDisplay');
	private hideMenu = new ThunderDispatcher<MenuListener, '__onMenuHide'>('__onMenuHide');

	show = (model: Menu_Model) => {
		this.showMenu.dispatchUI(model);
		console.log("pop! come on! pop!")
	};

	hide = (id: string) => this.hideMenu.dispatchUI(id);
}

export const MenuModule = new MenuModule_Class();

export class MenuBuilder {
	private readonly adapter: Adapter;
	private readonly position: MenuPosition;
	private readonly cssContainer?: CSSProperties;
	private id: string = generateHex(8);
	private onNodeClicked?: (path: string, item: any) => void;
	private onNodeDoubleClicked?: Function;


	constructor(menu: Adapter, position: MenuPosition, cssContainer?: CSSProperties) {
		this.adapter = menu;
		this.position = position;
		this.cssContainer = cssContainer;
	}

	show() {
		const model: Menu_Model = {
			id: this.id,
			adapter: this.adapter,
			pos: this.position,
			onNodeClicked: this.onNodeClicked,
			onNodeDoubleClicked: this.onNodeDoubleClicked,
			css: this.cssContainer
		};

		MenuModule.show(model);
	}

	setId(id: string) {
		this.id = id;
		return this;
	}

	setOnClick(func: (path: string, item: any) => void) {
		this.onNodeClicked = func;
		return this;
	}

	setOnDoubleClick(func: Function) {

		this.onNodeDoubleClicked = func;
		return this;
	}
}

