import {SearchAddOn, SearchAddOnDef} from '../../../_core/index.js';

enum BaseScore {
	ExactMatch = 1,
	StartsWith,
	Includes,
}

const calcScore = (base: number, index: number) => {
	return base - (1 / Math.pow(2, index));
};

export type AddOnDef_SearchTerms = SearchAddOnDef<'searchTerms', string | undefined, 'getSearchTerms', string[]>;
export const AddOn_SearchTerms: SearchAddOn<AddOnDef_SearchTerms> = {
	key: 'searchTerms',
	methodName: 'getSearchTerms',
	isActive: (param) => !!param && param.length >= 3,
	resultFilter: (value, result) => {
		const terms = result.filterResults[AddOn_SearchTerms.key].value as string[];
		let index: number;

		//Find exact match
		index = terms.findIndex(term => term === value);
		if (index !== -1)
			return {pass: true, score: calcScore(BaseScore.ExactMatch, index)};

		//Find StatsWith
		index = terms.findIndex(term => term.startsWith(value));
		if (index !== -1)
			return {pass: true, score: calcScore(BaseScore.StartsWith, index)};

		//Find Includes
		index = terms.findIndex(term => term.includes(value));
		if (index !== -1)
			return {pass: true, score: calcScore(BaseScore.Includes, index)};

		return {pass: false};
	}
};