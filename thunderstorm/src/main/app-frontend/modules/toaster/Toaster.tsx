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

import * as React from "react";
import {CSSProperties} from "react";
import {Toast_Model} from "./ToasterModule";
import {
	BaseToaster,
	ToastProps
} from "./BaseToaster";

export class Toaster
	extends BaseToaster {

	constructor(props: ToastProps) {
		super(props);
	}

	protected renderToaster(toast: Toast_Model) {
		const horizontal = toast.positionHorizontal;
		const vertical = toast.positionVertical;

		const style: CSSProperties = {
			justifyContent: "space-between",
			borderRadius: "4px",
			letterSpacing: "4px",
			boxShadow: "0 2px 5px 0 rgba(0, 0, 0, 0.28), 1px 2px 4px 0 rgba(0, 0, 0, 0.5)",
			position: "fixed",
			margin: "16px",
			background: toast.bgColor,
			bottom: vertical === "top" ? "unset" : 2,
			top: vertical === "top" ? 0 : "unset",
			left: horizontal === "left" ? 0 : horizontal === "center" ? "50%" : "unset",
			right: horizontal === "right" ? 0 : horizontal === "center" ? "auto" : "unset",
			transform: horizontal === "center" ? "translateX(-50%)" : "unset",
			zIndex: 9999
		};

		return (
			<div className={`ll_h_t ${toast.className}`} style={{...style, ...toast.style}}>
				{typeof toast.content === "string" ? <div dangerouslySetInnerHTML={{__html: toast.content}}/> : toast.content}
				{this.renderActions(toast)}
			</div>
		)
	}
}





