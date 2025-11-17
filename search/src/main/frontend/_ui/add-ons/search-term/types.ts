import {SearchAddOn, SearchAddOnDef} from '../../../_core';

enum SearchTermSortScore {
	ExactMatch,
	StartsWith,
	Includes,
}

export type AddOnDef_SearchTerm = SearchAddOnDef<'searchTerm', string | undefined, 'getSearchTerm', string>;
export const AddOn_SearchTerm: SearchAddOn<AddOnDef_SearchTerm> = {
	key: 'searchTerm',
	methodName: 'getSearchTerm',
	resultFilter: (value, result) => {
		const itemValue = result.filterResults[AddOn_SearchTerm.key].value as string;
		if (itemValue === value)
			return {pass: true, score: SearchTermSortScore.ExactMatch};
		if (itemValue.startsWith(value))
			return {pass: true, score: SearchTermSortScore.StartsWith};
		if (itemValue.includes(value))
			return {pass: true, score: SearchTermSortScore.Includes};
		return {pass: false};
	},
	isActive: (param) => !!param && param.length >= 3,
};