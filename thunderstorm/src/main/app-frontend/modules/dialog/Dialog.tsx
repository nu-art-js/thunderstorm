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
import {Properties} from "csstype";
// noinspection TypeScriptPreferShortImport
import {
	Dialog_Model,
	DialogButton_Builder,
	DialogListener,
	DialogModule
} from "./DialogModule";
// noinspection TypeScriptPreferShortImport
import {BaseComponent} from "../../core/BaseComponent";
import {stopPropagation} from "../../utils/tools";

const modalOverlay: Properties = {
	position: "fixed",
	top: 0,
	left: 0,
	width: "100%",
	height: "100%",
	display: "flex",
	alignItems: "center",
	justifyContent: "center"
};

const defaultDialogStyle: Properties = {
	borderRadius: "4px",
	boxShadow: "0px 2px 5px 0 rgba(0, 0, 0, 0.28)",
	backgroundColor: "#ffffff",
	margin: 0,
	minWidth: "200px",
	alignItems: "unset"
	// position: "absolute",
	// top: "50%",
	// left: "50%",
	// msTransform: "translate(-50%, -50%)",
	// transform: "translate(-50%, -50%)"
};

const defaultContentStyle: Properties = {
	// display: "inline-block",
	padding: "24px 18px 0",
};


const defaultButtonStyle: Properties = {
	borderRadius: "4px",
	color: "white",
	fontSize: "11px",
	letterSpacing: "-0.18px",
	outline: "none",
	margin: "0px 6px",
	height: "23px",
	width: "68px"
};

const defaultSubmitStyle: Properties = {
	backgroundColor: '#00b5ff'
};

const defaultCancelStyle: Properties = {
	backgroundColor: "#d9d9d9"
};


export const DialogButton_Submit = (onSubmit: () => void, label?: React.ReactNode) =>
	new DialogButton_Builder()
		.setStyle({...defaultSubmitStyle, ...defaultButtonStyle})
		.setContent(label || "Submit")
		.setAction(onSubmit);

export const DialogButton_Save = (onSave: () => void, label?: React.ReactNode) =>
	new DialogButton_Builder()
		.setStyle({...defaultSubmitStyle, ...defaultButtonStyle})
		.setContent(label || "Save")
		.setAction(onSave);

export const DialogButton_Undo = (onSave: () => void, label?: React.ReactNode) =>
	new DialogButton_Builder()
		.setStyle({...defaultSubmitStyle, ...defaultButtonStyle})
		.setContent(label || "Undo")
		.setAction(onSave);

export const DialogButton_Redo = (onSave: () => void, label?: React.ReactNode) =>
	new DialogButton_Builder()
		.setStyle({...defaultSubmitStyle, ...defaultButtonStyle})
		.setContent(label || "Redo")
		.setAction(onSave);

export const DialogButton_Close = (onSubmit?: () => void, label?: React.ReactNode) =>
	new DialogButton_Builder()
		.setStyle({...defaultSubmitStyle, ...defaultButtonStyle})
		.setContent(label || "Close")
		.setAction(onSubmit || DialogModule.close);

export const DialogButton_Cancel = (onSubmit?: () => void, label?: React.ReactNode) =>
	new DialogButton_Builder()
		.setStyle({...defaultCancelStyle, ...defaultButtonStyle})
		.setContent(label || "Cancel")
		.setAction(onSubmit || DialogModule.close);

type Props = {}

type State = { model?: Dialog_Model };

export class Dialog
	extends BaseComponent<Props, State>
	implements DialogListener {

	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	static closeWithEsc(e: any) {
		if (e.keyCode === 27)
			DialogModule.close();
	}

	__showDialog = (model?: Dialog_Model): void => {
		if (model && model.allowIndirectClosing)
			addEventListener("keydown", Dialog.closeWithEsc);
		else
			removeEventListener("keydown", Dialog.closeWithEsc);

		this.setState({model});
	};

	render() {
		const dialogModel = this.state.model;
		if (!dialogModel)
			return null;

		return (
			<div id="overlay" style={{...modalOverlay, background: dialogModel.overlayColor, zIndex: dialogModel.zIndex}} onClick={this.onOverlayClicked}>
				<div className={"ll_v_l"} style={{...defaultDialogStyle, ...(dialogModel.style || {})}}
				     onClick={stopPropagation}>
					{dialogModel.title && this.renderTitle(dialogModel.title)}
					{this.renderContent(dialogModel.content)}
					{this.renderButtons(dialogModel)}
				</div>
			</div>
		);
	}

	renderTitle = (title?: React.ReactNode) => {
		if (!title)
			return "";

		if (typeof title === "string")
			return <div style={{marginBottom: "12px"}}>
				<div dangerouslySetInnerHTML={{__html: title}}/>
			</div>;

		return <div className={"match_width"}>{title}</div>;
	};

	renderContent = (content: React.ReactNode) => {
		if (typeof content === "string")
			return <div style={defaultContentStyle}>
				<div dangerouslySetInnerHTML={{__html: content}}/>
			</div>;

		return content;
	};

	renderButtons = (model: Dialog_Model) => {
		if (!model)
			return null;

		if (model.buttons.length === 0)
			return "";

		const actionsStyle = {justifyContent: model.buttons.length > 1 ? "flex-end" : "center", ...(model.actionsStyle ? model.actionsStyle : {})};
		return <div className={`ll_h_c`} style={actionsStyle}>{model.buttons.map(
			(button, idx) =>
				<div key={idx}
				     className={button.className}
				     style={button.style}
				     onClick={button.action}>{button.content}
				</div>)}</div>;
	};

	private onOverlayClicked = (e: React.MouseEvent) => {
		stopPropagation(e);
		if (this.state.model && !this.state.model.allowIndirectClosing)
			return;

		DialogModule.close();
	};
}