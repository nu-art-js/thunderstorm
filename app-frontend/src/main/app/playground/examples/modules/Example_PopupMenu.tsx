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
import {LL_V_L, Menu_Model, ModuleFE_Menu, ShowTooltip, SimpleListAdapter} from '@nu-art/thunderstorm/frontend';
// import './PopupMenuExperience.scss'; add this back when moving scss files on build

const what_is_love: Menu_Model = {
	id: 'what-id-huh',
	adapter: SimpleListAdapter(['what', 'is', 'love'], renderer => <div>{renderer.item}</div>),
	pos: {
		top: 200,
		left: 200,
	},
	onNodeClicked: () => {
		ModuleFE_Menu.hide('what-id-huh');
	}
};

const PopupMenuExperience: React.FC = () => {
	// const addCategoryOnClick = () => {
	// 	Dialog_ValueEditor.show();
	// 	console.log('add a category');
	// };
	// const removeRowOnClick = () => {
	// 	Dialog_RemoveRow.show();
	// 	console.log('remove a row');
	// };
	return <LL_V_L>
		<span className={'popup-button'} onClick={() => {
			ModuleFE_Menu.show(what_is_love);
			console.log('what is love');
		}}>popup menu</span>
		{/*<span className={'popup-button'} onClick={addCategoryOnClick}>dialog add category</span>*/}
		{/*<span className={'popup-button'} onClick={removeRowOnClick}>dialog remove row</span>*/}
		<span className={'popup-button'}{...ShowTooltip(() => <div>bob</div>)}>Tooltip Test</span>
	</LL_V_L>;
};

export const Example_PopupMenu = {name: 'Popup Test', renderer: PopupMenuExperience};