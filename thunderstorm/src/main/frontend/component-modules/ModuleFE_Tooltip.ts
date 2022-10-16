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
import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';


export type Alignment = 'top' | 'right' | 'bottom' | 'left';

export type  Tooltip_Model = {
	content: JSX.Element;
	location?: {
		x: number,
		y: number
	};
	duration: number;
	allowContentHover: boolean;
	alignment?: Alignment;
};

export interface TooltipListener {
	__showTooltip(tooltip?: Tooltip_Model): void;
}

const dispatch_showTooltip = new ThunderDispatcher<TooltipListener, '__showTooltip'>('__showTooltip');

export class ModuleFE_Tooltip_Class
	extends Module<{}> {
	private _delayTimeOut: NodeJS.Timeout | undefined = undefined;
	/**
	 * Shows tooltip near position of mouse on entry
	 * @param content - The content to display
	 * @param e - The related mouse event
	 * @param alignment - position of the tooltip relative to the icon, defaults to top
	 * @param duration - Duration of time before content disappears on mouse leave, defaults to -1
	 * @param allowContentHover
	 */
	show = (content: () => JSX.Element, e: React.MouseEvent, alignment: Alignment = 'top', duration = -1, allowContentHover = false, delay = -1) => {
		this.showAt(content, e.pageX + 10, e.pageY + 15, duration, allowContentHover, alignment, delay);
	};

	/**
	 * Shows tooltip in specified location
	 * @param content - The content to display
	 * @param x - x position
	 * @param y - y position
	 * @param duration - Duration of time before content disappears on mouse leave, defaults to -1
	 * @param allowContentHover
	 */
	showAt = (content: () => JSX.Element, x: number, y: number, duration = -1, allowContentHover = false, alignment: Alignment = 'top', delay = -1) => {
		const _show = () => {
			const contentToRender = typeof content === 'function' ? content() : content;

			const model: Tooltip_Model = {
				content: contentToRender,
				location: {x, y},
				duration: duration,
				allowContentHover,
				alignment,
			};
			dispatch_showTooltip.dispatchUI(model);
		};

		if (delay === -1)
			_show();
		else
			this._delayTimeOut = setTimeout(() => _show(), delay);

	};

	hide = () => {
		clearTimeout(this._delayTimeOut);
		dispatch_showTooltip.dispatchUI();
	};
}

export const ModuleFE_Tooltip = new ModuleFE_Tooltip_Class();

/**
 *
 * @param content
 * @param alignment - position of the tooltip relative to the icon, defaults to top
 * @param duration
 * @param allowContentHover
 * @constructor
 */
export const ShowTooltip = (content: () => JSX.Element, alignment: Alignment = 'top', duration = -1, allowContentHover = false, delay = -1) => {
	return {
		onMouseEnter: (e: React.MouseEvent<any>) => ModuleFE_Tooltip.show(content, e, alignment, duration, allowContentHover, delay),
		onMouseLeave: (e: React.MouseEvent<any>) => ModuleFE_Tooltip.hide(),
	};
};

export const ShowTooltipAtTop = (content: () => JSX.Element, duration = -1, allowContentHover = false, delay = -1) => {

	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const data = e.currentTarget.getBoundingClientRect();
			const x = (data.right + data.x) / 2;
			const y = data.top - 10;
			ModuleFE_Tooltip.showAt(content, x, y, duration, allowContentHover, 'top', delay);
		},
		onMouseLeave: (e: React.MouseEvent<any>) => ModuleFE_Tooltip.hide(),
	};
};

export const ShowTooltipAtRight = (content: () => JSX.Element, duration = -1, allowContentHover = false, delay = -1) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const data = e.currentTarget.getBoundingClientRect();
			const x = data.right + 25;
			const y = (data.top + data.bottom) / 2;
			ModuleFE_Tooltip.showAt(content, x, y, duration, allowContentHover, 'right', delay);
		},
		onMouseLeave: (e: React.MouseEvent<any>) => ModuleFE_Tooltip.hide(),
	};
};

export const ShowTooltipAtLeft = (content: () => JSX.Element, duration = -1, allowContentHover = false, delay = -1) => {
	return {
		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
			const data = e.currentTarget.getBoundingClientRect();
			const x = data.left - 25;
			const y = (data.top + data.bottom) / 2;
			ModuleFE_Tooltip.showAt(content, x, y, duration, allowContentHover, 'left', delay);
		},
		onMouseLeave: (e: React.MouseEvent<any>) => ModuleFE_Tooltip.hide(),
	};
};

