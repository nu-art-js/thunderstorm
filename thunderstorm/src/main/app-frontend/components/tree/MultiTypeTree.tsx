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

import {_keys,} from "@nu-art/ts-common";
import {
	BaseTree,
	BaseTreeProps
} from "./BaseTree";
import {Menu} from "../../modules/menu/MenuModule";
import {DefaultGenericRenderer} from './MultiTypeTreeRenderer';

type MTT_Props = BaseTreeProps & {
	menu: Menu<any>,
}

const nodeAdjuster = (obj: object) => {
	if (!_keys(obj).find(key => key === "_children"))
		return {data: obj};

	// @ts-ignore
	const objElement = obj['_children'];
	// @ts-ignore
	objElement.type = obj.type;
	// @ts-ignore
	objElement.item = obj.item;

	// @ts-ignore
	return {data: objElement, deltaPath: '_children'};
}

export class MultiTypeTree
	extends BaseTree<MTT_Props> {

	static defaultProps: Partial<BaseTreeProps> = {
		...BaseTree._defaultProps,
		propertyFilter: <T extends object>(obj: T, key: keyof T) => key !== "item" && key !== 'type',
		renderer: DefaultGenericRenderer,
		// @ts-ignore
		nodeAdjuster: nodeAdjuster,
		hideRootElement: true,
	};

	constructor(p: MTT_Props) {
		super(p);
	}
}

