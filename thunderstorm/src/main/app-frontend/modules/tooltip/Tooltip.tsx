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
import {Tooltip_Model, TooltipListener, TooltipModule} from './TooltipModule';
import {ComponentSync} from '../../core/ComponentSync';
import {_setTimeout} from '@nu-art/ts-common';

type State = { model?: Tooltip_Model };

export const TooltipDefaultStyle: CSSProperties = {
	backgroundColor: '#f9f9f9',
	borderRadius: '3px',
	boxShadow: '0 0 4px 0 #00000066',
	color: '#333435',
	fontSize: '13px',
	padding: '1px 3px',
	position: 'fixed',
};

export class Tooltip
	extends ComponentSync<{}, State>
	implements TooltipListener {

	private ref?: HTMLDivElement | null;
	private timeoutInterval?: number;

	__showTooltip = (model?: Tooltip_Model) => {
		this.setState(() => ({model}));
		if (!model) {
			this.ref = null;
			return;
		}

		const duration = model.duration;
		if (duration <= 0)
			return;

		if (this.timeoutInterval)
			clearTimeout(this.timeoutInterval);

		this.timeoutInterval = _setTimeout(TooltipModule.hide, duration, model);
	};

	constructor(props: {}) {
		super(props);
		this.state = {};
	}

	render() {
		const {model} = this.state;
		if (!model || !model.content)
			return null;

		const top = model.location && model.location.y || 0;
		const left = model.location && model.location.x || 0;

		const height = (this.ref?.getBoundingClientRect().height || 0) / 2;
		const positionStyle = {
			top: `${top - height}px`,
			left: `${left}px`
		};
		return <div ref={(ref) => {
			if (this.ref)
				return;

			this.ref = ref;
			this.forceUpdate();
		}} id={'tooltip'} style={{...(model.style || TooltipDefaultStyle), ...positionStyle}}>
			{typeof model.content === 'string' ? <div dangerouslySetInnerHTML={{__html: model.content}}/> : model.content}
		</div>;
	}
}
