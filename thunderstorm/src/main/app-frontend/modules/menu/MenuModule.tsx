import {
	generateHex,
	Module
} from "@nu-art/ts-common";
import {MenuPosition} from "./PopupMenu";
import {ThunderDispatcher} from "../../core/thunder-dispatcher";
import {
	_GenericRenderer,
	_RendererMap
} from "../../components/tree/Adapter";

export const resolveRealPosition = (button: HTMLImageElement): MenuPosition => {
	const pos = button.getBoundingClientRect();
	return {top: pos.top + button.offsetHeight, left: pos.left};
};

// export type TreeAction = (path: string, id: string) => void;
export type _Menu<Rm extends _RendererMap> = _GenericRenderer<Rm>

export type Menu_Model = {
	id: string
	menu: _Menu<any>,
	pos: MenuPosition,
	onNodeClicked?: Function,
	onNodeDoubleClicked?: Function,
};

export interface MenuListener {
	__onMenuDisplay: (menu: Menu_Model) => void
	__onMenuHide: (id: string) => void
}

// export type MenuItemWrapper<Rm extends RendererMap, K extends keyof Rm, Item = InferItemType<Rm[K]>> = ItemWrapper<Rm, K> & {
// 	_children?: MenuItemWrapper<Rm, keyof Rm>[]
// }
//
// export type Menu<Rm extends RendererMap> = {
// 	rendererMap: Rm
// 	_children: MenuItemWrapper<Rm, keyof Rm>[]
// }

export class MenuModule_Class
	extends Module<{}> {

	private showMenu = new ThunderDispatcher<MenuListener, "__onMenuDisplay">("__onMenuDisplay");
	private hideMenu = new ThunderDispatcher<MenuListener, "__onMenuHide">("__onMenuHide");

	show = (model: Menu_Model) => {
		this.showMenu.dispatchUI([model])
	};

	hide = (id: string) => this.hideMenu.dispatchUI([id]);
}

export const MenuModule = new MenuModule_Class();

export class MenuBuilder {
	private readonly menu: _Menu<any>;
	private readonly position: MenuPosition;
	private id: string = generateHex(8);
	private onNodeClicked?: Function;
	private onNodeDoubleClicked?: Function;

	constructor(menu: _Menu<any>, position: MenuPosition) {
		this.menu = menu;
		this.position = position;
	}

	show() {
		const model: Menu_Model = {
			id: this.id,
			menu: this.menu,
			pos: this.position,
			onNodeClicked: this.onNodeClicked,
			onNodeDoubleClicked: this.onNodeDoubleClicked
		};

		MenuModule.show(model);
	};

	setId(id: string) {
		this.id = id;
		return this;
	}

	setOnClick(func: Function) {
		this.onNodeClicked = func;
		return this;
	}

	setOnDoubleClick(func: Function) {
		this.onNodeDoubleClicked = func;
		return this;
	}
}

