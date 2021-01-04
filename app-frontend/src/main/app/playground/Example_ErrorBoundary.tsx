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

type State = {
	counter: number
}

export class Example_ErrorBoundary
	extends React.Component<{}, State> {

	constructor(props: {}) {
		super(props);
		this.state = {
			counter: 0
		};
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick = () => {
		console.log(this.state.counter);
		this.setState(({counter}) => {
			if (counter === 3)
				throw new Error('I crashed!');
			return ({counter: counter + 1});
		});
	};

	render() {
		return <div>
			<p>click on the number to increase the counter. The counter is programmed to throw an error when it reaches 4, which will be caught by React's error boundaries.</p>
			<h1 onClick={this.handleClick}>{this.state.counter}</h1>
		</div>
	}

}
