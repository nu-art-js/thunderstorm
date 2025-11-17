import {sortArray} from '@nu-art/ts-common';
import {SearchSorter} from '../../../_core/SearchSorter';
import {AddOnDef_SearchTerm} from '../../add-ons/search-term';
import {AddOnDef_SearchTerms} from '../../add-ons/search-terms/types';

export const SearchSorter_SearchTerms: SearchSorter<AddOnDef_SearchTerms> = {
	key: 'searchTerms',
	sortFunction: (results) => {
		sortArray(results, result => (result.filterResults[SearchSorter_SearchTerms.key].value as AddOnDef_SearchTerm['itemValueType']).length);
		sortArray(results, result => result.filterResults[SearchSorter_SearchTerms.key].score);
	}
};