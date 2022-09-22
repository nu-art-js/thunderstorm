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
import {Tooltip_Model, TooltipListener} from '../../component-modules/ModuleFE_Tooltip';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_TooltipOverlay.scss';
import {_className} from '../../utils/tools';


type State = {
	model?: Tooltip_Model,
};

type PosStyle = {
	top: number;
	left: number;
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
		// this.timeoutInterval = _setTimeout(ModuleFE_Tooltip.hide, duration, model);
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

	private keepInViewStyle = (style: PosStyle) => {
		if (!this.ref)
			return;
		const pos = this.ref?.getBoundingClientRect();
		const viewPortWidth = window.innerWidth;
		const contentWidth = pos.right - pos.left;
		const viewPortHeight = window.innerHeight;
		const contentHeight = pos.bottom - pos.top;

		console.log(Number(style.left));
		console.log(pos);

		// Check overflowing right
		if (pos.right > (viewPortWidth - 20))
			style.left = viewPortWidth - contentWidth - 20;

		//Check overflowing left
		if (pos.left < 20 || style.left < 20)
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
		const width = (this.ref?.getBoundingClientRect().width || 0);
		const height = (this.ref?.getBoundingClientRect().height || 0);

		const top = model.location ? model.location.y : 0;
		const left = model.location ? model.location.x : 0;
		// const bottom = top + height;
		// const right = left + width;

		if (model.alignment === 'top')
			return {
				top: top - height - 10,
				left: left + width / 2,
			};

		if (model.alignment === 'right')
			return {
				top: top - height / 2,
				left: left + 10,
			};

		if (model.alignment === 'left')
			return {
				top: top - height / 2,
				left: left - width - 10,
			};

		//Alignment is bottom
		return {
			top: top + 10,
			left: left - width / 2,
		};
	};

	render() {
		const {model} = this.state;
		if (!model || !model.content)
			return null;

		let positionStyle = this.getPosObject(model);
		if (this.ref)
			positionStyle = {...positionStyle, ...this.keepInViewStyle(positionStyle)};

		const className = _className('ts-tooltip', `align-${model.alignment}`);
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
			style={{top: `${positionStyle.top}px`, left: `${positionStyle.left}px`}}>
			{typeof model.content === 'string' ? <div dangerouslySetInnerHTML={{__html: model.content}}/> : model.content}
		</div>;
	}
}
