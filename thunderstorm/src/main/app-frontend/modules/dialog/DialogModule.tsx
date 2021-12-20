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

import * as React from "react";
import {Module} from "@nu-art/ts-common";
import {ThunderDispatcher} from "../../core/thunder-dispatcher";
import { Stylable, StylableBuilder } from "../../tools/Stylable";
import {Color, Properties} from "../../components/types";

export type Dialog_Model = Stylable & {
	zIndex: number,
	title?: React.ReactNode,
	content: React.ReactNode,
	buttons: DialogButtonModel[],
	overlayColor?: Color,
	actionsStyle?: Properties,
	allowIndirectClosing?: boolean,
}

export type DialogButtonModel = Stylable & {
	content: React.ReactNode;
	action: () => void;
}

export interface DialogListener {
	__showDialog(dialogModel?: Dialog_Model): void;
}

const dispatch_showDialog = new ThunderDispatcher<DialogListener, "__showDialog">("__showDialog");

export class DialogModule_Class
	extends Module<{}> {

	constructor() {
		super();
	}

	protected init(): void {
	}

	public close = () => {
		dispatch_showDialog.dispatchUI([])
	};

	public show = (params: Dialog_Model) => {
		dispatch_showDialog.dispatchUI([params])
	}
}


export class DialogButton_Builder
	extends StylableBuilder {

	content!: React.ReactNode;
	action!: () => void;


	setContent(content: React.ReactNode) {
		this.content = content;
		return this;
	}

	setAction(action: () => void) {
		this.action = action;
		return this;
	}

	build(): DialogButtonModel {
		return {
			style: this.style,
			className: this.className,
			content: this.content,
			action: this.action,
		};
	}
}

export class Dialog_Builder
	extends StylableBuilder {
	content: React.ReactNode;
	zIndex: number = 100;

	title!: React.ReactNode;
	buttons: DialogButtonModel[] = [];
	overlayColor: Color = "rgba(29, 29, 48, 0.6)";
	allowIndirectClosing: boolean = false;
	actionsStyle: Properties = {};

	constructor(content: React.ReactNode) {
		super();
		this.content = content;
	}

	setAllowIndirectClosing(allowIndirectClosing: boolean) {
		this.allowIndirectClosing = allowIndirectClosing;
		return this;
	}

	setOverlayColor(overlayColor: Color) {
		this.overlayColor = overlayColor;
		return this;
	}

	setActionsStyle(actionsStyle: Properties) {
		this.actionsStyle = actionsStyle;
		return this;
	}

	setTitle(title: React.ReactNode) {
		this.title = title;
		return this;
	}

	setButtons(...buttons: DialogButtonModel[]) {
		this.buttons = buttons;
		return this;
	}

	addButton(button: DialogButtonModel) {
		this.buttons = [...this.buttons, button];
		return this;
	}

	setZIndex(zIndex: number = 100) {
		this.zIndex = zIndex;
		return this;
	}

	show() {
		const model: Dialog_Model = {
			style: this.style,
			className: this.className,
			buttons: this.buttons,
			allowIndirectClosing: this.allowIndirectClosing,
			content: this.content,
			title: this.title,
			zIndex: this.zIndex,
			overlayColor: this.overlayColor,
			actionsStyle: this.actionsStyle
		};

		DialogModule.show(model);
	}
}

export const DialogModule = new DialogModule_Class();
