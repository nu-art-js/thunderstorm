import {sortArray} from '@nu-art/ts-common';
import {SearchSorter} from '../../../_core/SearchSorter';
import {AddOnDef_SearchTerm} from '../../add-ons/search-term';

export const SearchSorter_SearchTerm: SearchSorter<AddOnDef_SearchTerm> = {
	key: 'searchTerm',
	sortFunction: (results) => {
		sortArray(results, result => (result.filterResults[SearchSorter_SearchTerm.key].value as AddOnDef_SearchTerm['itemValueType']).length);
		sortArray(results, result => result.filterResults[SearchSorter_SearchTerm.key].score);
	}
};