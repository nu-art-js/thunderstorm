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

import * as React from 'react';
import {generateHex, Module, ResolvableContent} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';
import {Adapter} from '../components/adapter/Adapter';
import {TS_Tree} from '../components/TS_Tree';


export const resolveRealPosition = (button: HTMLImageElement) => {
	const pos = button.getBoundingClientRect();
	return {y: pos.top + button.offsetHeight, x: pos.left};
};

export type Coordinates = { x: number, y: number };

type PopUp_Model = {
	id: string
	modalPos: Coordinates,
	triggerPos: Coordinates
	offset?: Coordinates
};

export type PopUp_Model_Menu = PopUp_Model & {
	adapter: Adapter,
	onNodeClicked?: (path: string, item: any) => void
	onNodeDoubleClicked?: Function,
}

export type PopUp_Model_Content = PopUp_Model & {
	content: ResolvableContent<React.ReactNode>;
}

export interface PopUpListener {
	__onPopUpDisplay: (content: PopUp_Model_Content) => void;
	__onPopUpHide: (id: string) => void;
}

export class ModuleFE_PopUp_Class
	extends Module<{}> {

	private showPopUp = new ThunderDispatcher<PopUpListener, '__onPopUpDisplay'>('__onPopUpDisplay');
	private hidePopUp = new ThunderDispatcher<PopUpListener, '__onPopUpHide'>('__onPopUpHide');

	showMenu = (model: PopUp_Model_Menu) => {
		const content: React.ReactNode = <TS_Tree
			className={'ts-popup__content__menu'}
			id={generateHex(8)}
			adapter={model.adapter}
			onNodeClicked={model.onNodeClicked}
		/>;

		this.showContent({
			id: model.id,
			content,
			triggerPos: model.triggerPos,
			modalPos: model.modalPos
		});
	};

	showContent = (content: PopUp_Model_Content) => {
		this.showPopUp.dispatchUI(content);
	};

	hide = (id: string) => this.hidePopUp.dispatchUI(id);
}

export const OpenPopupAtLeft = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const triggerRect = e.currentTarget.getBoundingClientRect();
			const x = triggerRect.x + (triggerRect.width / 2);
			const y = triggerRect.y + (triggerRect.height / 2);
			const margin = (triggerRect.width / 2);

			const model: PopUp_Model_Content = {
				id,
				content,
				triggerPos: {x, y},
				modalPos: {x: -1, y: 0},
				offset: {x: -margin + (offset ?? 0), y: 0}
			};
			ModuleFE_PopUp.showContent(model);
		}
	};
};

export const OpenPopupAtRight = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const triggerRect = e.currentTarget.getBoundingClientRect();
			const x = triggerRect.x + (triggerRect.width / 2);
			const y = triggerRect.y + (triggerRect.height / 2);
			const margin = (triggerRect.width / 2);

			const model: PopUp_Model_Content = {
				id,
				content,
				triggerPos: {x, y},
				modalPos: {x: 1, y: 0},
				offset: {x: margin + (offset ?? 0), y: 0}
			};
			ModuleFE_PopUp.showContent(model);
		}
	};
};

export const OpenPopupAtBottom = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const triggerRect = e.currentTarget.getBoundingClientRect();
			const x = triggerRect.x + (triggerRect.width / 2);
			const y = triggerRect.y + (triggerRect.height / 2);
			const margin = (triggerRect.height / 2);

			const model: PopUp_Model_Content = {
				id,
				content,
				triggerPos: {x, y},
				modalPos: {x: 0, y: 1},
				offset: {x: 0, y: margin + (offset ?? 0)}
			};
			ModuleFE_PopUp.showContent(model);
		}
	};
};

export const OpenPopupAtTop = (id: string, content: () => JSX.Element, offset?: number) => {
	return {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			const triggerRect = e.currentTarget.getBoundingClientRect();
			const x = triggerRect.x + (triggerRect.width / 2);
			const y = triggerRect.y + (triggerRect.height / 2);
			const margin = (triggerRect.height / 2);

			const model: PopUp_Model_Content = {
				id,
				content,
				triggerPos: {x, y},
				modalPos: {x: 0, y: -1},
				offset: {x: 0, y: -margin + (offset ?? 0)}
			};
			ModuleFE_PopUp.showContent(model);
		}
	};
};

export const ModuleFE_PopUp = new ModuleFE_PopUp_Class();

export class MenuBuilder {
	private readonly adapter: Adapter;
	private readonly position: Coordinates;
	private id: string = generateHex(8);
	private onNodeClicked?: (path: string, item: any) => void;
	private onNodeDoubleClicked?: Function;

	constructor(menu: Adapter, position: Coordinates) {
		this.adapter = menu;
		this.position = position;
	}

	show() {
		const model: PopUp_Model_Menu = {
			id: this.id,
			adapter: this.adapter,
			triggerPos: this.position,
			modalPos: {x: 1, y: 1},
			onNodeClicked: this.onNodeClicked,
			onNodeDoubleClicked: this.onNodeDoubleClicked,
		};

		ModuleFE_PopUp.showMenu(model);
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