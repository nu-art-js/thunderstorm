/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Intuition Robotics
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
	ToastBuilder,
	ToastModule
} from "@intuitionrobotics/thunderstorm/frontend";
import * as ReactDOM from "react-dom";
import {
	ErrorToast,
	InfoToast,
	SuccessToast
} from "../../themes/toaster";


export class Example_Toaster
	extends React.Component {
	constructor(props: {}) {
		super(props);

		this.state = {
			formFields: {},
		};
	}

	showAppToasterSuccessExample = () => {
		ToastModule.toastSuccess("Simple success message");
	};

	showAppToasterErrorExample = () => {
		ToastModule.toastError("Simple error message");
	};

	showAppToasterInfoExample = () => {
		ToastModule.toastInfo("Simple info message");
	};

	showAppToasterCustomInfoExample = () => {
		InfoToast("Custom info message closes in 3 sec", 3000)
	};
	showAppToasterCustomErrorExample = () => {
		ErrorToast("Custom Error message closes in 8 sec", 8000)
	};
	showAppToasterCustomSuccessExample = () => {
		SuccessToast("Custom Success message closes time by thunde default")
	};

	showAppToasterLiveDocsExample = () => {
		new ToastBuilder().setContent("kaki").setActions([<button style={{marginRight: 8}} onClick={this.showAppToasterSuccessExample}>edit</button>]).show();
	};

	render() {
		return <>
			<div>
				<button style={{marginRight: 8}} onClick={this.showAppToasterSuccessExample}>Toaster Default Success Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterErrorExample}>Toaster Default Failure Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterInfoExample}>Toaster Default Info Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterLiveDocsExample}>Toaster Default Live Docs Example</button>
			</div>
			<hr/>
			<div>
				<button style={{marginRight: 8}} onClick={this.showAppToasterCustomSuccessExample}>Toaster Custom Success Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterCustomErrorExample}>Toaster Custom Failure Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterCustomInfoExample}>Toaster Custom Info Example</button>
			</div>
		</>;
	}
}

const elementById = document.getElementById("toasters.js");
if (elementById)
	ReactDOM.render(
		<Example_Toaster/>,
		elementById
	);
