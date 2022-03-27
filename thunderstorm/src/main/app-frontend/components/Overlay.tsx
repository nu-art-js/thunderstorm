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

import * as React from 'react';
import {CSSProperties} from 'react';

type Props = {
	zIndex: number
	showOverlay: boolean
	onClickOverlay: (event: React.MouseEvent<HTMLDivElement>) => void
};

const overlayStyle = (zIndex: number): CSSProperties => ({
	zIndex,
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0
});

const childrenStyle = (zIndex: number) => ({
	zIndex,
});

export class Overlay
	extends React.Component<Props> {

	static defaultProps: Partial<Props> = {
		zIndex: 2
	};

	render() {
		if (!this.props.showOverlay)
			return this.props.children;

		return <>
			<div style={childrenStyle(this.props.zIndex + 1)}>
				{this.props.children}
			</div>

			<div onClick={event => this.props.onClickOverlay(event)} style={overlayStyle(this.props.zIndex)}/>
		</>;
	}
}