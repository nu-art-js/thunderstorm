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
import {Adapter} from '../adapter/Adapter';

export type NodeExpandCondition = (key: string, value: any, level: number, path: string) => boolean | undefined;

export type TreeNodeExpandState = { [path: string]: true | undefined };

export type TreeNode = {
	propKey: string
	path: string
	item: any
	adapter: Adapter
	expandToggler: (e: React.MouseEvent, expand?: boolean) => void
	onClick: (e: React.MouseEvent) => void
	onFocus: (e: React.MouseEvent) => void
	expanded: boolean
	focused: boolean
	selected: boolean
};