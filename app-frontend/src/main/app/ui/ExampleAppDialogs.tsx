/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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
import * as CSS from 'csstype';
import * as emotion from "emotion";
import {
	BaseComponent,
	createDefaultInfoModel,
	createDefaultSubmitActionModel,
	Dialog,
	Dialog_Model,
	DialogButton_Special1,
	DialogListener,
	DialogModule,

} from "@nu-art/thunder";

const dialogStyle: CSS.Properties = {
	color: "white",
	background: "black"
};

const actionsStyle: CSS.Properties = {
	background: "gray",
	width: "100%",
	height: "55px",
	padding: "0px 18px",
};

const buttonStyle = emotion.css`{
	border-radius: 7px;
	color: yellow;
	font-size: 11px;
	height: 30px;
	width: 75px;
}`;

const submitStyle = emotion.css`{
	color: blue;
	:hover{
		background-color: green;
	}
}`;

export const appConfirmationDialog = (_content: React.ReactNode, onSubmit: () => void, title?: string, icon?: string) => {
	const content = (
		<div>
			{icon && <img src={icon}/>}
			{_content}
		</div>
	);
	const dialog: Dialog_Model = createDefaultSubmitActionModel(content, onSubmit, title, '', '', false);
	dialog.overlayBG = "rgba(102, 255, 255, 0.4)";
	dialog.dialogStyle = dialogStyle;
	dialog.actionsStyle = actionsStyle;
	dialog.buttonStyle = buttonStyle;
	dialog.submitStyle = submitStyle;
	dialog.buttons.unshift(DialogButton_Special1(() => {
		console.log("Don't know yet...");
		DialogModule.close();
	}, "Wait!!", submitStyle));


	return dialog
};

export class ExampleAppDialogs
	extends BaseComponent<{}, { dialog?: Dialog_Model }>
	implements DialogListener {

	constructor(props: any) {
		super(props);
		this.state = {dialog: undefined}
	}

	showDialog = (dialog?: Dialog_Model): void => {
		this.setState({dialog});
	};

	showDefaultInfoModalExample = () => {
		const title = "Default info modal";
		const content = "This is an example of the use of info modal with the default styling. If you use the default builders you don't need an AppDialog component";
		DialogModule.show(createDefaultInfoModel(content, title))
	};

	showAppConfirmationDialogExample = () => {
		const title = "App confirmation dialog";
		const content = <div><p>This is an example of app dialog - in this case confirmation. You can create many app dialogs for different purposes.</p>
			<p>Press Submit and check up the console</p></div>;
		const onSubmit = () => {
			console.log("You pressed Submit");
			DialogModule.close();
		};
		this.showDialog(appConfirmationDialog(content, onSubmit, title));
	};

	render() {
		return (
			<div>
				<button style={{marginRight: 8}} onClick={this.showDefaultInfoModalExample}>Click me!</button>
				<button style={{marginRight: 8}} onClick={this.showAppConfirmationDialogExample}>Click me too!</button>
				<Dialog model={this.state.dialog}/>
			</div>
		);
	}


}