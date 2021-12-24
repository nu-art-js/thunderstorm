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

import {CSSProperties} from 'react';

export type  Stylable = {
	style?: CSSProperties
	className?: string
}

export class StylableBuilder {
	style?: CSSProperties;
	className?: string;

	setStyle(style: CSSProperties) {
		this.style = style;
		return this;
	}

	clearInlineStyle() {
		this.style = {};
		return this;
	}

	addStyle(style: CSSProperties) {
		if (!this.style)
			return this.setStyle(style);

		this.style = {...this.style, ...style};
		return this;
	}

	setClassName(className: string) {
		this.className = className;
		return this;
	}

	build() {
		const styleable: Stylable = {
			style: this.style,
			className: this.className
		};

		return styleable;
	}
}
