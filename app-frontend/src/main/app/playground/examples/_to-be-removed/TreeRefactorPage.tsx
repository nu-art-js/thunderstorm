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
import {Playground_DropdownSingleAndMulti} from '../components/dropdown/Example_Dropdown_SingleAndMulti';
import {Playground_DropdownMultiType} from '../components/dropdown/Example_Dropdown_MultiType';
import {Playground_DropdownSingleType} from '../components/dropdown/Example_Dropdown_SingleType';
import {Playground_Tree_Data} from '../keyboard-listener/Example_Tree_Data';
import {Playground_Tree_Basic} from '../keyboard-listener/Example_Tree_Basic';
import {Playground_Tree_MultiType} from '../keyboard-listener/Example_Tree_MultiType';
import {LL_H_T} from '@nu-art/thunderstorm/frontend';

const TreeRefactorPage_Renderer = () => (<>
	<div className="ll_v_l" style={{width: '100%', height: '100%'}}>
		<LL_H_T className="ts-playground__group-example">
			{Playground_DropdownSingleAndMulti.renderer}
			{Playground_DropdownSingleType.renderer}
			{Playground_DropdownMultiType.renderer}
		</LL_H_T>
		<LL_H_T className="ts-playground__group-example">
			{Playground_Tree_Data.renderer}
			{Playground_Tree_Basic.renderer}
			{Playground_Tree_MultiType.renderer}
		</LL_H_T>
	</div>
</>);

export const TreeRefactorPage = {renderer: TreeRefactorPage_Renderer, name: 'Page for Tree refactoring'};