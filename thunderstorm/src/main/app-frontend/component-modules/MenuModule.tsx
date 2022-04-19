/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {generateHex, Module} from '@nu-art/ts-common';
import {MenuPosition} from '../components/TS_PopupMenu';
import {ThunderDispatcher} from '../core/thunder-dispatcher';
import {Adapter,} from '../components/adapter/Adapter';

export const resolveRealPosition = (button: HTMLImageElement): MenuPosition => {
	const pos = button.getBoundingClientRect();
	return {top: pos.top + button.offsetHeight, left: pos.left};
};

export type Menu_Model = {
	id: string
	adapter: Adapter,
	pos: MenuPosition,
	onNodeClicked?: (path: string, item: any) => void
	onNodeDoubleClicked?: Function,
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
	};

	hide = (id: string) => this.hideMenu.dispatchUI(id);
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
			onNodeDoubleClicked: this.onNodeDoubleClicked,
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

