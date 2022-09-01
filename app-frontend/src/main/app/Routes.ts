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

import {ModuleFE_Routing} from '@nu-art/thunderstorm/frontend';
import {Page_Playground} from './playground/Page_Playground';
import {Parent} from './Parent';
import {Child2} from './Child2';
import {Child1} from './Child1';

export const Route_Home = 'home';
export const Route_Login = 'login';
export const Route_Playground = 'playground';

export const registerRoutes = () => {
	ModuleFE_Routing.clearRoutes();

	//home route should be declared last
	ModuleFE_Routing.addRoute('child2', '/parent/child2', Child2).setLabel('Child2');
	ModuleFE_Routing.addRoute('child1', '/parent/child1', Child1).setLabel('Child1');
	ModuleFE_Routing.addRoute('parent', '/parent', Parent);
	ModuleFE_Routing.addRoute(Route_Home, '/', Page_Playground).setLabel('Home').setExact(false);
};
