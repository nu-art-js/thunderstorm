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
import {PlaygroundScreen, TS_Playground} from '@nu-art/thunderstorm/frontend';
import {Page_ApiGen} from '../pages/Page_ApiGen';
import {Hello} from '../Hello';
import {Example_ApiCustomError} from './examples/Example_ApiCustomError';
import {Example_Dialogs} from './examples/modules/Example_Dialogs';
import {Example_Toaster} from './examples/modules/Example_Toaster';
import {TreeRefactorPage} from './examples/_to-be-removed/TreeRefactorPage';
import {ICONS} from '@res/icons';
import {Example_Form} from './examples/Example_Form';
import {Example_TriggerPush} from './examples/Example_TriggerPush';
import {Example_AllDropDowns} from './examples/components/dropdown/Example_AllDropDowns';
import {Playground_DropdownSingleAndMulti} from './examples/components/dropdown/Example_Dropdown_SingleAndMulti';
import {Example_Tree_SingleType} from './examples/tree/Example_Tree_SingleType';
import {Example_List_WithInput} from './examples/list/Example_List_WithInput';
import {Example_Uploader} from './examples/Example_Uploader';
import {Example_TSInput} from './examples/components/Example_TSInput';
import {Example_PermissionsComponent} from './examples/Example_PermissionsComponent';
import {SP_Example_Tree_SingleType} from './examples/new-props-examples/tree/SP_Example_Tree_SingleType';
import {Example_Analytics} from './examples/Example_Analytics';
import {Example_Scatter} from './examples/Example_Scatter';
import {Example_TSTextArea} from './examples/components/Example_TSTextArea';
import {Example_CCgraphs} from './examples/Example_CCgraphs';
import {Example_FieldEditorClick} from './examples/Example_FieldEditorClick';
import {Example_Tree_MultiType} from './examples/tree/Example_Tree_MultiType';
import {Playground_DropdownSingleType} from './examples/components/dropdown/Example_Dropdown_SingleType';
import {Playground_DropdownMultiType} from './examples/components/dropdown/Example_Dropdown_MultiType';
import {Playground_Tree_Data} from './examples/keyboard-listener/Example_Tree_Data';
import {Playground_Tree_Basic} from './examples/keyboard-listener/Example_Tree_Basic';
import {Playground_Tree_MultiType} from './examples/keyboard-listener/Example_Tree_MultiType';
import {PgDev_Tabs} from './examples/components/PgDev_Tabs';
import {Example_PopupMenu} from './examples/modules/Example_PopupMenu';
import {PgDev_Loader} from './examples/components/PgDev_Loader/PgDev_Loader';
import {PgDev_WorkspaceTest} from './examples/components/PgDev_WorkspaceTest/PgDev_WorkspaceTest';
import {PgDev_Toaster} from './examples/components/PgInfra_Toaster';


export class Page_Playground
	extends React.Component<{}> {

	constructor(props: {}) {
		super(props);
		this.state = {};
	}

	render() {
		const screens = this.getScreens();
		return <TS_Playground
			iconClose={ICONS.arrowClose()}
			iconOpen={ICONS.arrowOpen()}
			screens={screens}
		/>;
	}

	getScreens(): PlaygroundScreen[] {
		return [

			////Components
			// Inputs
			Example_TSInput,
			Example_TSTextArea,
			Example_FieldEditorClick,
			// Dropdowns
			Example_AllDropDowns,
			Playground_DropdownSingleAndMulti,
			Playground_DropdownSingleType,
			Playground_DropdownMultiType,
			//Misc
			PgDev_Tabs,
			PgDev_Loader,
			PgDev_WorkspaceTest,

			////Modules
			Example_PopupMenu,
			PgDev_Toaster,

			// SWITCH PROPS
			// TREES / LISTS
			SP_Example_Tree_SingleType,
			Playground_Tree_Data,
			Playground_Tree_Basic,
			Playground_Tree_MultiType,
			Example_Tree_SingleType,
			Example_Tree_MultiType,
			TreeRefactorPage,
			Example_List_WithInput,
			Example_Uploader,
			Example_Form,
			Hello,
			Example_Dialogs,
			Example_Toaster,
			Page_ApiGen,
			Example_TriggerPush,
			Example_ApiCustomError,
			Example_PermissionsComponent,
			Example_Analytics,
			Example_Scatter,
			Example_CCgraphs

			// {renderer: Example_NestedList_MultiType_Object, name: 'NestedList_MultiType_Object',},
			// {renderer: Example_NestedList_MultiType_Object_Dynamic, name: 'NestedList_MultiType_Object_Dynamic',},
			// {renderer: Example_List_All, name: 'Example_List_All',},
			// {renderer: Example_List_SingleType, name: 'List_SingleType_Menu',},
			// {renderer: Example_NestedList_SingleType, name: 'List_SingleType_NestedMenu',},
			// {renderer: Example_List_MultiType, name: 'List_MultiType_Menu',},
			// {renderer: Example_NestedList_MultiType, name: 'NestedList_MultiType',},
			// {renderer: SP_Example_List_MultiType, name: 'SP_Example_List_MultiType',},
			// {renderer: SP_Example_List_SingleType, name: 'SP_Example_List_SingleType',},
			// {renderer: SP_Example_NestedList_SingleType, name: 'SP_Example_NestedList_SingleType',},
			// {renderer: SP_Example_NestedList_MultiType, name: 'SP_Example_NestedList_MultiType',},
		];
	}
}