/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {BugReportModule} from "../modules/BugReportModule";
import {
	Dialog_Builder,
	DialogButton_Cancel,
	DialogButton_Submit,
	DialogModule,
	ToastModule,
	TS_Input,
	TS_TextArea
} from "@intuitionrobotics/thunderstorm/frontend";

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
	error?: Error,
	errorInfo?: React.ErrorInfo
	description?: string
	subject?: string
}

export class BugReport
	extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props);
		this.state = {}
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		BugReportModule.sendBugReport("Automatic submission", "these logs were triggered by a UI failure");
		this.setState({
			              error: error,
			              errorInfo: errorInfo
		              });
	}

	showAppConfirmationDialogExample = () => {
		const title = "Bug Report";

		const onSubmit = () => {
			if (!this.state.subject)
				return ToastModule.toastError('you must first add a subject');
			BugReportModule.sendBugReport(this.state.subject, this.state.description || '');
			this.setState({subject: undefined, description: undefined});
			DialogModule.close();
		};

		const content =
			      <div className={'ll_v_c'}>
				      <div style={{
					      border: `1px solid darkslategray`,
					      marginBottom: "5px",
					      width: "91%",
					      margin: "8px"
				      }}>
					      <TS_Input
						      id={"bug-report-subject"}
						      type={"text"}
						      value={this.state.subject || ''}
						      placeholder={"type bug name here"}
						      onChange={(subject: string) => this.setState({subject})}
					      />
				      </div>
				      <TS_TextArea
					      id={"bug-report-description"}
					      type="text"
					      style={{height: "110px", margin: "8px", width: "100%", outline: "none"}}
					      value={this.state.description || ''}
					      placeholder={"type bug description here"}
					      onChange={(description: string) => this.setState({description})}/>
			      </div>;


		new Dialog_Builder(content)
			.setTitle(title)
			.addButton(DialogButton_Cancel(() => {
				this.setState({description: undefined, subject: undefined})
				DialogModule.close();
			}))
			.addButton(DialogButton_Submit(() => onSubmit(), 'Submit'))
			.setOverlayColor("rgba(102, 255, 255, 0.4)")
			.show();
	}

	render() {
		if (this.state.errorInfo) {
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
};