import {DatabaseDef_ShortUrl} from '@nu-art/ts-short-url-shared';
import {ModuleFE_ShortUrl} from './ModuleFE_ShortUrl.js';
import {GenericDropDownV3} from '@nu-art/thunderstorm-frontend/index';

const Props_DropDown = {
	module: ModuleFE_ShortUrl,
	modules: [ModuleFE_ShortUrl],
	mapper: (item: DatabaseDef_ShortUrl['dbType']) => [item.title],
	placeholder: 'Choose a ShortUrl',
	renderer: (item: DatabaseDef_ShortUrl['dbType']) => <div className="ll_h_c"> {item.title} </div>
};

export const DropDown_ShortUrl = GenericDropDownV3.prepare(Props_DropDown as any);

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
