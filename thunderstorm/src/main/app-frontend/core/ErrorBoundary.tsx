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

type State = {
	error?: Error,
	errorInfo?: React.ErrorInfo
}
const style: React.CSSProperties = {
	cursor: "pointer",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	position: "absolute",
	width: "50px",
	height: "50px",
	bottom: "0px",
	right: "0px",
	backgroundColor: "#FF5733",
	color: "white",
	borderRadius: "50%"
};

export class ErrorBoundary
	extends React.Component<{}, State> {

	constructor(props: {}) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromError(error: Error) {
		return {error};
	};

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({error, errorInfo});
	}

	render() {
		if (this.state.error) {
			return (<div style={{position: "relative"}}>
					<div style={{paddingBottom: 50}}>
						<div style={{fontSize: 20, marginBottom: 8}}>Something went wrong...</div>
						<div style={{fontSize: 16, marginBottom: 8}}>{this.state.error.toString()}</div>
						<details style={{whiteSpace: 'pre-wrap'}}>
							{this.state.errorInfo?.componentStack}
						</details>
					</div>
					<div className="match_height match_width">
						<button style={style} onClick={() => this.setState({error: undefined})}>Reload!</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}