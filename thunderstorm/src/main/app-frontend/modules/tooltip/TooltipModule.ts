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

import * as React from "react";
import {
	Module,
	Second
} from "@intuitionrobotics/ts-common";
import {ThunderDispatcher} from "../../core/thunder-dispatcher";
import {
	Stylable,
	StylableBuilder
} from "../../tools/Stylable";

export type  Tooltip_Model = Stylable & {
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

const dispatch_showTooltip = new ThunderDispatcher<TooltipListener, "__showTooltip">("__showTooltip");
const Interval_DefaultTooltip = 6 * Second;

export class TooltipModule_Class
	extends Module<{}> {


	show = (tooltip: Tooltip_Model, e?: MouseEvent) => {
		if (!tooltip.location && e)
			tooltip.location = {x: e.pageX + 10, y: e.pageY + 15};

		dispatch_showTooltip.dispatchUI([tooltip])
	};

	hide = () => dispatch_showTooltip.dispatchUI([]);
}

export const TooltipModule = new TooltipModule_Class();

export class TooltipBuilder
	extends StylableBuilder {

	private readonly content: React.ReactNode;
	private location = {x: 0, y: 0};
	private duration: number = Interval_DefaultTooltip;

	constructor(content: React.ReactNode, e?: React.MouseEvent) {
		super();

		this.content = content;
		if (e)
			this.location = {
				x: e.pageX + 10,
				y: e.pageY + 15
			}
	}

	setLocation = (x: number, y: number) => {
		this.location = {x, y};
		return this;
	};


	setDuration = (duration: number) => {
		this.duration = duration;
		return this;
	};

	show = () => {
		const model: Tooltip_Model = {
			content: this.content,
			location: this.location,
			style: this.style,
			className: this.className,
			duration: this.duration,
		};

		TooltipModule.show(model)
	}
}

