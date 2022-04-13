/*
 * A typescript & react boilerplate with api call example
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
import {
	Dialog_Builder,
	DialogButton_Cancel,
	DialogButton_Submit,
	DialogModule,
} from "@nu-art/thunderstorm/frontend";

export const noButton = () => {
	new Dialog_Builder("No Buttons!")
		.setTitle("Look Mom")
		.setStyle({width: "300px"})
		.setcloseOverlayOnClick(true)
		.show();
};

export const showDefaultInfoModalExample = () => {
	const title = "Default info modal";
	const content = "This is an example of the use of info modal with the default styling. If you use the default builders you don't need an AppDialog component";
	new Dialog_Builder(content)
		.setTitle(title)
		.setStyle({width: "300px"})
		.setcloseOverlayOnClick(true)
		.addButton(DialogButton_Cancel(DialogModule.close))
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
