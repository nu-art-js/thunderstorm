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

import * as React from 'react';
import {ComponentSync, ModuleFE_Routing} from '@thunder-storm/core/frontend';
import {Parent} from './Parent';

export class Child1
	extends ComponentSync {

	protected deriveStateFromProps(nextProps: any) {
		return {};
	}

	render() {
		return <Parent>
			<div>Child1</div>
			{ModuleFE_Routing.getLink('child2')}
		</Parent>;
	}

}
