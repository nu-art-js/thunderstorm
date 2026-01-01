/*
 * A typescript & react boilerplate with api call example
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

import {TS_Route} from "@nu-art/thunder-routing";
import {Page_Playground} from './playground/Page_Playground.js';
import {Parent} from './Parent.js';
import {Child2} from './Child2.js';
import {Child1} from './Child1.js';

export const Route_Home = 'home';
export const Route_Login = 'login';
export const Route_Playground = 'playground';

// Note: Child routes must be defined before parent route that references them
export const Route_Child2: TS_Route = {
	key: 'child2',
	path: 'child2',
	Component: Child2,
};

export const Route_Child1: TS_Route = {
	key: 'child1',
	path: 'child1',
	Component: Child1,
};

export const Route_Parent: TS_Route = {
	key: 'parent',
	path: 'parent',
	Component: Parent,
	children: [
		Route_Child1,
		Route_Child2,
	],
};

export const Route_Root: TS_Route = {
	key: 'root',
	path: '/',
	Component: Page_Playground,
	fallback: true,
	children: [
		Route_Parent,
	],
};
