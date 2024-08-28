import * as React from 'react';
import {DBProto_ShortUrl} from '../shared';
import {ModuleFE_ShortUrl} from './ModuleFE_ShortUrl';
import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown} from '@thunder-storm/core/frontend';

const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_ShortUrl> = {
	module: ModuleFE_ShortUrl,
	modules: [ModuleFE_ShortUrl],
	mapper: item => [item.title],
	placeholder: 'Choose a ShortUrl',
	renderer: item => <div className="ll_h_c"> {item.title} </div>
};

export const DropDown_ShortUrl = GenericDropDownV3.prepare(Props_DropDown);

// const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
// 	module: ModuleFE_ShortUrl,
// 	itemRenderer: (item, onDelete) => {
// 		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete}
// 																className={'ts-icon__small'}/>{item.title}</>;
// 	},
// 	uiSelector: DropDown_ShortUrl.selectable,
// });
//
// export const MultiSelect_ShortUrl = TS_MultiSelect_V2.prepare(Props_MultiSelect)
