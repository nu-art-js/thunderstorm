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

export const ActionButton = (props: { action: string | (() => void), icon: string, classCss?: string|{[key:string]:any} }) => {
	let _action: () => any;
	if (typeof props.action === "string")
		_action = () => window.open(props.action as string, "_blank");
	else
		_action = props.action;
	return <div style={{padding: 5}}>
		<img
			className={`clickable ${typeof props.classCss === "string"? props.classCss:""}`}
			style={typeof props.classCss === "object"?props.classCss:{}}
			src={props.icon}
			onClick={_action}/>
	</div>
};


