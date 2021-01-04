/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from 'react';
import {_setTimeout} from '@ir/ts-common';

type Props = {
	src: string
	onLoaded: (src: string) => void
}

export class SimpleScriptInjector
	extends React.Component<Props> {

	static readonly injected: { [src: string]: HTMLScriptElement } = {};

	componentDidMount(): void {
		if (SimpleScriptInjector.injected[this.props.src]) {
			_setTimeout(() => this.props.onLoaded(this.props.src));
			return;
		}

		const script: HTMLScriptElement = document.createElement("script");
		script.type = "text/javascript";
		script.src = this.props.src;
		script.async = true;
		script.id = this.props.src;
		script.onload = () => this.props.onLoaded(this.props.src);
		document.body.appendChild(script);
		SimpleScriptInjector.injected[this.props.src] = script;
	}

	render() {
		return "";
	}
}