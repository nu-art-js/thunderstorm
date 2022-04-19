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

export type  Tooltip_Model = {
	content: React.ReactNode;
	location?: {
		x: number,
		y: number
	};
	duration: number;
};

export interface TooltipListener {
	__showTooltip(tooltip?: Tooltip_Model): void;
}

const dispatch_showTooltip = new ThunderDispatcher<TooltipListener, '__showTooltip'>('__showTooltip');

export class TooltipModule_Class
	extends Module<{}> {


	show = (content: React.ReactNode, e: React.MouseEvent, duration = -1) => {
		const model: Tooltip_Model = {
			content,
			location: {x: e.pageX + 10, y: e.pageY + 15},
			duration: duration,
		};

		dispatch_showTooltip.dispatchUI(model);
	};

	showAt = (content: React.ReactNode, x: number, y: number, duration = -1) => {
		const model: Tooltip_Model = {
			content,
			location: {x, y},
			duration: duration,
		};


		dispatch_showTooltip.dispatchUI(model);
	};

	hide = () => dispatch_showTooltip.dispatchUI();
}

export const TooltipModule = new TooltipModule_Class();
export const ShowTooltip = (content: React.ReactNode, duration = -1) => {
	return {
		onMouseEnter: (e: React.MouseEvent<any>) => TooltipModule.show(content, e, duration),
		onMouseLeave: (e: React.MouseEvent<any>) => TooltipModule.hide()
	};
};