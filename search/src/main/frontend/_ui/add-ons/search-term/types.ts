import {SearchAddOn, SearchAddOnDef} from '../../../_core';

export type AddOnDef_SearchTerm = SearchAddOnDef<'searchTerm', string | undefined, 'getSearchTerm', string>;
export const AddOn_SearchTerm: SearchAddOn<AddOnDef_SearchTerm> = {
	key: 'searchTerm',
	methodName: 'getSearchTerm',
	valueFilter: (param, itemParam) => itemParam.includes(param),
	isActive: (param) => !!param && param.length >= 3,
};