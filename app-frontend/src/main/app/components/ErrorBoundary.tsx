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
type State = {
	error:Error | null,
	errorInfo: React.ErrorInfo | null
}
const style: React.CSSProperties = {
	cursor: "pointer",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	position: "fixed",
	width: "50px",
	height: "50px",
	bottom: "530px",
	right: "10px",
	backgroundColor: "#FF5733",
	color: "white",
	borderRadius: "50%"
};

export class BoundaryError extends React.Component<{}, State> {
	constructor(props: {}) {
		super(props);
		this.state = {error:null, errorInfo:null};
	}

	componentDidCatch(error:Error, errorInfo:React.ErrorInfo) {
  		this.setState({
			              error: error,
			              errorInfo: errorInfo
		              })
	}

	render() {
		if (this.state.errorInfo) {
			return (
				<div>
					<h2>Something went wrong.</h2>
					<details style={{ whiteSpace: 'pre-wrap' }}>
						{this.state.error && this.state.error.toString()}
						<br />
						{this.state.errorInfo.componentStack}
					</details>
					<button style={style} onClick={() =>window.location.reload()}>reload!</button>
				</div>
			);
		}
		return this.props.children;
	}
}