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
import {Tooltip_Model, TooltipListener} from '../../component-modules/TooltipModule';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_TooltipOverlay.scss';
import {_className} from '../../utils/tools';


type State = {
	model?: Tooltip_Model,
};

type PosStyle = {
	top?: number | string;
	left?: number | string;
	bottom?: number | string;
	right?: number | string;
}

export class TS_TooltipOverlay
	extends ComponentSync<{}, State>
	implements TooltipListener {

	private ref?: HTMLDivElement | null;
	// private timeoutInterval?: number;
	private timeout: NodeJS.Timeout | undefined = undefined;

	__showTooltip = (model?: Tooltip_Model) => {
		//Clear timeout if one exists
		if (this.timeout)
			clearTimeout(this.timeout);

		//If exited tooltip but waiting for content hover
		if (!model && this.state?.model?.allowContentHover) {
			this.ref = null;
			this.timeout = setTimeout(() => {
				this.setState(() => ({model}));
			}, this.state.model.duration);
		} else {
			this.setState(() => ({model}));
			if (!model) {
				this.ref = null;
				return;
			}
			const duration = model.duration;
			if (duration <= 0)
				return;
		}
		// this.timeoutInterval = _setTimeout(TooltipModule.hide, duration, model);
	};

	constructor(props: {}) {
		super(props);
		this.state = {};
	}

	protected deriveStateFromProps(nextProps: {}): State | undefined {
		return {};
	}

	private onContentMouseEnter = () => {
		if (!this.state.model?.allowContentHover)
			return;

		//Clear the timeout to stop hiding the content
		if (this.timeout)
			clearTimeout(this.timeout);
	};

	private onContentMouseLeave = () => {
		this.ref = null;
		this.timeout = setTimeout(() => {
			this.setState(() => ({model: undefined}));
		}, this.state.model?.duration);
	};

	private keepInViewStyle = () => {
		if (!this.ref)
			return;
		const pos = this.ref?.getBoundingClientRect();
		const viewPortWidth = window.innerWidth;
		const contentWidth = pos.right - pos.left;
		const viewPortHeight = window.innerHeight;
		const contentHeight = pos.bottom - pos.top;

		const style: PosStyle = {};

		// Check overflowing right
		if (pos.right > (viewPortWidth - 20))
			style.left = viewPortWidth - contentWidth - 20;

		//Check overflowing left
		if (pos.left < 20)
			style.left = 20;

		//Check overflowing top
		if (pos.top < 20)
			style.top = 20;

		//Check overflowing bottom
		if (pos.bottom > (viewPortHeight - 20))
			style.top = viewPortHeight - contentHeight - 20;

		return style;
	};

	private getPosObject = (model: Tooltip_Model): PosStyle => {
		const top = model.location && model.location.y || 0;
		const left = model.location && model.location.x || 0;
		// const bottom = model.location && (window.innerHeight - model.location.y || 0);
		const right = model.location && (window.innerWidth - model.location.x || 0);
		const height = (this.ref?.getBoundingClientRect().height || 0) / 2;

		if (model.alignment === 'right' || model.alignment === 'top')
			return {
				top: `${top - height}px`,
				left: `${left}px`,
				right: 'unset',
				bottom: 'unset'
			};

		if (model.alignment === 'left')
			return {
				top: `${top - height}px`,
				right: `${right}px`,
				left: 'unset',
				bottom: 'unset'
			};

		return {};
	};

	render() {
		const {model} = this.state;
		if (!model || !model.content)
			return null;

		let positionStyle = this.getPosObject(model);

		if (this.ref)
			positionStyle = {...positionStyle, ...this.keepInViewStyle()};

		const className = _className('ts-tooltip', model.alignment);
		return <div
			onMouseEnter={this.onContentMouseEnter}
			onMouseLeave={this.onContentMouseLeave}
			ref={(ref) => {
				if (this.ref)
					return;
				this.ref = ref;
				this.forceUpdate();
			}}
			className={className}
			id={'tooltip'}
			style={{...positionStyle}}>
			{typeof model.content === 'string' ? <div dangerouslySetInnerHTML={{__html: model.content}}/> : model.content}
		</div>;
	}
}
