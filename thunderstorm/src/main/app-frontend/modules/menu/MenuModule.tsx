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
	__onMenuDisplay: (menu?: Menu_Model) => void
}

type RefAndIcon = {
	ref: HTMLImageElement
	icon?: () => string
}

export type MenuItemWrapper<Rm extends RendererMap, K extends keyof Rm, Item = InferItemType<Rm[K]>> = ItemWrapper<Rm, K> & {
	_children?: MenuItemWrapper<Rm, keyof Rm>[]
}

export type Menu<Rm extends RendererMap> = {
	rendererMap: Rm
	_children: MenuItemWrapper<Rm, keyof Rm>[]
}

export class MenuModule_Class
	extends Module<{}> {

	private showMenu = new ThunderDispatcher<MenuListener, "__onMenuDisplay">("__onMenuDisplay");

	cache: { [id: string]: RefAndIcon } = {};

	show = (model: Menu_Model, obj: RefAndIcon) => {
		this.cache[model.id] = obj;

		this.showMenu.dispatchUI([model])
	};

	hide = (id?: string) => {
		const obj = id && this.cache[id];
		if (id && obj && obj.icon) {
			console.log(id, obj.icon());
			obj.ref.src = obj.icon();
		}

		return this.showMenu.dispatchUI([]);
	};
}

export const MenuModule = new MenuModule_Class();

export class MenuBuilder {
	private readonly menu: Menu<any>;
	private readonly position: MenuPosition;
	private readonly imageRef: HTMLImageElement;
	private iconClose?: () => string;
	private id: string = generateHex(8);

	constructor(menu: Menu<any>, imageRef: HTMLImageElement) {
		this.menu = menu;
		this.imageRef = imageRef;
		this.position = resolveRealPosition(this.imageRef);
	}

	show() {
		const model: Menu_Model = {
			id: this.id,
			menu: this.menu,
			pos: this.position
		};

		MenuModule.show(model, {ref: this.imageRef, icon: this.iconClose});
	};

	setId(id: string) {
		this.id = id;
		return this;
	}

	setIconClose(iconClose: () => string) {
		this.iconClose = iconClose;
		return this;
	}

}

