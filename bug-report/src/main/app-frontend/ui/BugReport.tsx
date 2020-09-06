/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {BugReportModule} from "../modules/BugReportModule";
import {
	Dialog_Builder,
	DialogButton_Cancel,
	DialogButton_Submit,
	DialogModule,
	TS_Input,
	TS_TextArea
} from "@nu-art/thunderstorm/frontend";

type Props = {
	component?: React.ReactNode
}
const style: React.CSSProperties = {
	cursor: "pointer",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	position: "fixed",
	width: "50px",
	height: "50px",
	bottom: "30px",
	right: "10px",
	backgroundColor: "#5b7bd6",
	color: "white",
	borderRadius: "50%",
	borderColor: 'transparent'
};
type State = {
	error: Error | null,
	errorInfo: React.ErrorInfo | null
}

export class BugReport
	extends React.Component<Props, State> {

	constructor(props: {}) {
		super(props);
		this.state = {error: null, errorInfo: null};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({
			              error: error,
			              errorInfo: errorInfo
		              })
	}

	onSubmitAutomatic = (withJira: boolean = false) => {
		BugReportModule.sendBugReport("Automatic submission", "these logs were triggered by a UI failure", withJira);
		DialogModule.close();
	};

	showAppConfirmationDialogExample = () => {
		const title = "Submit bug report";
		let description: string = "";
		let subject: string = "";

		const onSubmit = (withJira: boolean = false) => {
			BugReportModule.sendBugReport(subject, description, withJira);
			DialogModule.close();
		};

		const content =
			      <div className={'ll_v_c'}>
				      <TS_Input
					      id={"bug-report-subject"}
					      type={"text"}
					      value={subject}
					      placeholder={"type a subject here"}
					      onChange={(value: string) => {
						      subject = value;
					      }}
				      />
				      <TS_TextArea
					      style={{height: "110px", margin: "8px", width: "100%", outline: "none"}}
					      value={description}
					      placeholder={"type your description here"}
					      onChange={(value: string) => {
						      description = value;
					      }}/>
			      </div>


		new Dialog_Builder(content)
			.setTitle(title)
			.addButton(DialogButton_Cancel(DialogModule.close))
			.addButton(DialogButton_Submit(() => onSubmit(true), 'Jira'))
			.addButton(DialogButton_Submit(() => onSubmit(false), 'No Jira'))
			.setOverlayColor("rgba(102, 255, 255, 0.4)")
			.show();
	};

	render() {
		if (this.state.errorInfo) {
			this.onSubmitAutomatic()
			return (
				<div>
					<h2>Something went wrong.</h2>
					<details style={{whiteSpace: 'pre-wrap'}}>
						{this.state.error && this.state.error.toString()}
						<br/>
						{this.state.errorInfo.componentStack}
					</details>
					<button style={style} onClick={() => window.location.reload()}>reload!</button>
				</div>
			);
		}
		return (
			<>
				{this.props.children}
				<div
					onClick={this.showAppConfirmationDialogExample}>
					{this.props.component ||
					<button style={style}>+</button>}
				</div>
			</>
		);
	}
}