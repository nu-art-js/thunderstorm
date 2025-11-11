import {SearchAddOn, SearchAddOnDef} from '../../_core';

type AddOnDef_SearchTerm = SearchAddOnDef<'searchTerm', string | undefined, 'getSearchTerm', string>;

export const AddOn_SearchTerm: SearchAddOn<AddOnDef_SearchTerm> = {
	key: 'searchTerm',
	valueFilter: (param, itemParam) => itemParam.includes(param),
	isActive: (param) => !!param && param.length >= 3,
};

type AddOnDef_SearchTerms = SearchAddOnDef<'searchTerms', string | undefined, 'getSearchTerms', string[]>

export const AddOn_SearchTerms: SearchAddOn<AddOnDef_SearchTerms> = {
	key: 'searchTerms',
	valueFilter: (param, itemParam) => itemParam.some(value => value.includes(param)),
	isActive: (param) => !!param && param.length >= 3,
};