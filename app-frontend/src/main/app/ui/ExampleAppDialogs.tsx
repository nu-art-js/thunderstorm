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
import {
	Dialog_Builder,
	DialogButton_Cancel,
	DialogButton_Submit,
	DialogButton_Undo,
	DialogModule,
	DialogButton_Save
} from "@nu-art/thunder";
import {StyledInput} from "@nu-art/user-account/frontend";
import {LiveDocsModule} from "../../../../../live-docs/src/main/app-frontend/modules/LiveDocsModule";

// const dialogStyle: CSS.Properties = {
// 	color: "white",
// 	background: "black"
// };
//
// const actionsStyle: CSS.Properties = {
// 	background: "gray",
// 	width: "100%",
// 	height: "55px",
// 	padding: "0px 18px",
// };
//
// const buttonStyle = emotion.css`{
// 	border-radius: 7px;
// 	color: yellow;
// 	font-size: 11px;
// 	height: 30px;
// 	width: 75px;
// }`;
//
// const submitStyle = emotion.css`{
// 	color: blue;
// 	:hover{
// 		background-color: green;
// 	}
// }`;
export const showEditModalExample = () => {
	const title = "Default Edit modal";

	let text = "I am text";
	const content = <div>
		<StyledInput value={text} onChange={(value, id) => {
			return text = value;
		}}/>
	</div>

	new Dialog_Builder(content)
		.setTitle(title)
		.setStyle({maxWidth: "400px"})
		.addButton(DialogButton_Cancel(DialogModule.close))
		.addButton(DialogButton_Save(() => {
			// LiveDocsModule.update({});
			console.log(text);
			DialogModule.close();
		})) // undo
		.addButton(DialogButton_Undo(DialogModule.close)) // redo
		.setOverlayColor("rgba(102, 255, 255, 0.4)")
		.show();
};

export const showDefaultInfoModalExample = () => {
	const title = "Default info modal";
	const content = "This is an example of the use of info modal with the default styling. If you use the default builders you don't need an AppDialog component";
	new Dialog_Builder(content)
		.setTitle(title)
		.addButton(DialogButton_Cancel(DialogModule.close))
		.setOverlayColor("rgba(102, 255, 255, 0.4)")
		.show();
};

export const showAppConfirmationDialogExample = () => {
	const title = "App confirmation dialog";
	const onSubmit = () => {
		console.log("You pressed Submit");
		DialogModule.close();
	};

	const content = (
		<div>
			<div><p>This is an example of app dialog - in this case confirmation. You can create many app dialogs for different purposes.</p>
				<p>Press Submit and check up the console</p></div>
		</div>
	);

	new Dialog_Builder(content)
		.setTitle(title)
		.addButton(DialogButton_Cancel(DialogModule.close))
		.addButton(DialogButton_Submit(onSubmit))
		.setOverlayColor("rgba(102, 255, 255, 0.4)")
		.show();
};