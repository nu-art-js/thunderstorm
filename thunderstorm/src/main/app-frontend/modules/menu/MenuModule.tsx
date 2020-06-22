import {
	generateHex,
	Module
} from "@nu-art/ts-common";
import {MenuPosition} from "./PopupMenu";
import {ThunderDispatcher} from "../../core/thunder-dispatcher";
import {
	_GenericRenderer,
	_RendererMap,
	Adapter
} from "../../components/tree/Adapter";

export const resolveRealPosition = (button: HTMLImageElement): MenuPosition => {
	const pos = button.getBoundingClientRect();
	return {top: pos.top + button.offsetHeight, left: pos.left};
};

// export type TreeAction = (path: string, id: string) => void;
export type _Menu<Rm extends _RendererMap> = _GenericRenderer<Rm>

export type Menu_Model = {
	id: string
	adapter: Adapter,
	pos: MenuPosition,
	onNodeClicked?: (path: string, item: any) => void
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
	private readonly adapter: Adapter;
	private readonly position: MenuPosition;
	private id: string = generateHex(8);
	private onNodeClicked?: (path: string, item: any) => void;
	private onNodeDoubleClicked?: Function;

	constructor(menu: Adapter, position: MenuPosition) {
		this.adapter = menu;
		this.position = position;
	}

	show() {
		const model: Menu_Model = {
			id: this.id,
			adapter: this.adapter,
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

	setOnClick(func: (path:string,item:any) => void) {
		this.onNodeClicked = func;
		return this;
	}

	setOnDoubleClick(func: Function) {

		this.onNodeDoubleClicked = func;
		return this;
	}
}

