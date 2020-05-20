import {
	generateHex,
	Module
} from "@nu-art/ts-common";
import {
	MenuPosition
} from "./PopupMenu";

import {ThunderDispatcher} from "../../core/thunder-dispatcher";
import {
	InferItemType,
	ItemWrapper,
	RendererMap
} from "../../types/renderer-map";

export const resolveRealPosition = (button: HTMLImageElement): MenuPosition => {
	const pos = button.getBoundingClientRect();
	return {top: pos.top + button.offsetHeight, left: pos.left};
};

export type Menu_Model = {
	id: string
	menu: Menu<any>,
	pos: MenuPosition
};

export interface MenuListener {
<<<<<<< HEAD
	__onMenuDisplay: (menu?: Menu_Model) => void
}

type RefAndIcon = {
	ref?: HTMLImageElement
	icon?: () => string
=======
	__onMenuDisplay: (menu: Menu_Model) => void
	__onMenuHide: (id: string) => void
>>>>>>> dcbe2d749eaa51092b6ea91b1a42ecb028ed8e9f
}

export type MenuItemWrapper<Rm extends RendererMap, K extends keyof Rm, Item = InferItemType<Rm[K]>> = ItemWrapper<Rm, K> & {
	_children?: MenuItemWrapper<Rm, keyof Rm>[]
}

export type Menu<Rm extends RendererMap> = {
	rendererMap: Rm
	_children: MenuItemWrapper<Rm, keyof Rm>[]
	onClick?: ()=>void
}

export class MenuModule_Class
	extends Module<{}> {

	private showMenu = new ThunderDispatcher<MenuListener, "__onMenuDisplay">("__onMenuDisplay");
	private hideMenu = new ThunderDispatcher<MenuListener, "__onMenuHide">("__onMenuHide");

	show = (model: Menu_Model) => {
		this.showMenu.dispatchUI([model])
	};

<<<<<<< HEAD
	hide = (id?: string) => {
		const obj = id && this.cache[id];
		if (id && obj && obj.ref && obj.icon) {
			console.log(id, obj.icon());
			obj.ref.src = obj.icon();
		}

		return this.showMenu.dispatchUI([]);
	};
=======
	hide = (id: string) => this.hideMenu.dispatchUI([id]);
>>>>>>> dcbe2d749eaa51092b6ea91b1a42ecb028ed8e9f
}

export const MenuModule = new MenuModule_Class();

export class MenuBuilder {
	private readonly menu: Menu<any>;
	private readonly position: MenuPosition;
<<<<<<< HEAD
	private readonly imageRef?: HTMLImageElement;
	private iconClose?: () => string;
	private id: string = generateHex(8);

	constructor(menu: Menu<any>, imageRef?: HTMLImageElement) {
		this.menu = menu;
		this.imageRef = imageRef;
		this.position = this.imageRef ? resolveRealPosition(this.imageRef) : {left: 225, top: 0};
=======
	private id: string = generateHex(8);

	constructor(menu: Menu<any>, position: MenuPosition) {
		this.menu = menu;
		this.position = position;
>>>>>>> dcbe2d749eaa51092b6ea91b1a42ecb028ed8e9f
	}

	show() {
		const model: Menu_Model = {
			id: this.id,
			menu: this.menu,
			pos: this.position
		};

		MenuModule.show(model);
	};

	setId(id: string) {
		this.id = id;
		return this;
	}
}

