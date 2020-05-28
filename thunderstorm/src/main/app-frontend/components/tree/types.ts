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

export type Action = { action?: (p?: any) => any }
export type TreeNodeItem = (Action & { [key: string]: any });

export type TreeNode = {
	item: TreeNodeItem | string | number | object
	path: string
	name: string
	onClick: (e: React.MouseEvent) => void
	onDoubleClick: (e: React.MouseEvent) => void

	expandToggler: (e: React.MouseEvent, expand?: boolean) => void
	expanded: boolean
	focused: boolean
};

export type TreeNodeAdjuster = (obj: object) => {
	data: object
	deltaPath?: string
};

export type PropertyFilter = <T extends object>(obj: T, key: keyof T) => any;

export type TreeRenderer = (props: TreeNode) => React.ReactElement