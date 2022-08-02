// /*
//  * Permissions management system, define access level for each of
//  * your server apis, and restrict users by giving them access levels
//  *
//  * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
//
// import * as React from 'react';
// import {CSSProperties} from 'react';
// import {BugReportModule} from '../modules/BugReportModule';
// import {DialogModule, ToastModule, TS_Input, TS_TextArea} from '@nu-art/thunderstorm/frontend';
// import {generateHex} from '@nu-art/ts-common';
// import {Platform_Jira, Platform_Slack} from '../../shared/api';
//
// type Props = {
// 	component?: React.ReactNode
// }
// const style: React.CSSProperties = {
// 	cursor: 'pointer',
// 	display: 'flex',
// 	alignItems: 'center',
// 	justifyContent: 'center',
// 	position: 'fixed',
// 	width: '50px',
// 	height: '50px',
// 	bottom: '30px',
// 	right: '10px',
// 	backgroundColor: '#5b7bd6',
// 	color: 'white',
// 	borderRadius: '50%',
// 	borderColor: 'transparent'
// };
// type State = {
// 	error?: Error,
// 	errorInfo?: React.ErrorInfo
// 	description?: string
// 	subject?: string
// }
//
// export class BugReport
// 	extends React.Component<Props, State> {
//
// 	constructor(props: Props) {
// 		super(props);
// 		this.state = {};
// 	}
//
// 	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
// 		BugReportModule.sendBugReport('Automatic submission', 'these logs were triggered by a UI failure', [Platform_Slack]);
// 		this.setState({
// 			error: error,
// 			errorInfo: errorInfo
// 		});
// 	}
//
// 	showAppConfirmationDialogExample = () => {
// 		const title = 'Bug Report';
//
// 		const onSubmit = () => {
// 			if (!this.state.subject)
// 				return ToastModule.toastError('you must first add a subject');
// 			if (!this.state.description)
// 				return ToastModule.toastError('you must first add a description');
// 			BugReportModule.sendBugReport(this.state.subject, this.state.description || '', [Platform_Jira]);
// 			this.setState({subject: undefined, description: undefined});
// 			DialogModule.close();
// 		};
//
// 		const content =
// 			<div className={'ll_v_c'}>
// 				<div style={{
// 					border: `1px solid darkslategray`,
// 					marginBottom: '5px',
// 					width: '91%',
// 					margin: '8px'
// 				}}>
// 					<TS_Input
// 						id={'bug-report-subject'}
// 						type={'text'}
// 						value={this.state.subject || ''}
// 						placeholder={'type bug name here'}
// 						name={generateHex(8)}
// 						onChange={(subject: string) => this.setState({subject})}
// 					/>
// 				</div>
// 				<TS_TextArea
// 					id={'bug-report-description'}
// 					type="text"
// 					style={{height: '110px', margin: '8px', width: '100%', outline: 'none'}}
// 					value={this.state.description || ''}
// 					placeholder={'type bug description here'}
// 					onChange={(description: string) => this.setState({description})}/>
// 			</div>;
//
//
// 		// new Dialog_Builder(content)
// 		// 	.setTitle(title)
// 		// 	.addButton(DialogButton_Cancel(() => {
// 		// 		this.setState({description: undefined, subject: undefined});
// 		// 		DialogModule.close();
// 		// 	}))
// 		// 	.addButton(DialogButton_Submit(() => onSubmit(), 'Submit'))
// 		// 	.setOverlayColor('rgba(102, 255, 255, 0.4)')
// 		// 	.show();
// 	};
//
// 	render() {
// 		if (this.state.errorInfo) {
// 			return (
// 				<div>
// 					<h2>Something went wrong!!</h2>
// 					<details style={{whiteSpace: 'pre-wrap'}}>
// 						{this.state.error && this.state.error.toString()}
// 						<br/>
// 						{this.state.errorInfo.componentStack}
// 					</details>
// 					<button style={style} onClick={() => window.location.reload()}>reload!</button>
// 				</div>
// 			);
// 		}
//
// 		return (
// 			<>
// 				{this.props.children}
// 				<div
// 					onClick={this.showAppConfirmationDialogExample}>
// 					{this.props.component ||
// 						<button style={style}>+</button>}
// 				</div>
// 			</>
// 		);
// 	}
// }
//
//
// //todo To remove:
//
// export class DialogButton_Builder
// 	extends StylableBuilder {
//
// 	content!: React.ReactNode;
// 	action!: () => void;
// 	associatedKeys: string[] = [];
//
//
// 	setContent(content: React.ReactNode) {
// 		this.content = content;
// 		return this;
// 	}
//
// 	setAction(action: () => void) {
// 		this.action = action;
// 		return this;
// 	}
//
// 	setAssociatedKeys(associatedKeys: string[]) {
// 		this.associatedKeys = associatedKeys;
// 		return this;
// 	}
//
// 	build(): DialogButtonModel {
// 		return {
// 			style: this.style,
// 			className: this.className,
// 			content: this.content,
// 			action: this.action,
// 			associatedKeys: this.associatedKeys,
// 		};
// 	}
// }
//
// export type DialogButtonModel = Stylable & {
// 	content: React.ReactNode;
// 	associatedKeys: string[];
// 	action: () => void;
// }
// const defaultButtonStyle: CSSProperties = {
// 	borderRadius: '4px',
// 	color: 'white',
// 	fontSize: '11px',
// 	letterSpacing: '-0.18px',
// 	outline: 'none',
// 	margin: '0px 6px',
// 	height: '23px',
// 	width: '68px'
// };
//
// const defaultSubmitStyle: CSSProperties = {
// 	backgroundColor: '#00b5ff'
// };
//
// const defaultCancelStyle: CSSProperties = {
// 	backgroundColor: '#d9d9d9'
// };
// export const DialogButton_Cancel = (onSubmit?: () => void, label?: React.ReactNode) =>
// 	new DialogButton_Builder()
// 		.setStyle({...defaultCancelStyle, ...defaultButtonStyle})
// 		.setContent(label || 'Cancel')
// 		.setAction(onSubmit || DialogModule.close);
//
// export const DialogButton_Submit = (onSubmit: () => void, label?: React.ReactNode) =>
// 	new DialogButton_Builder()
// 		.setStyle({...defaultSubmitStyle, ...defaultButtonStyle})
// 		.setContent(label || 'Submit')
// 		.setAction(onSubmit);
