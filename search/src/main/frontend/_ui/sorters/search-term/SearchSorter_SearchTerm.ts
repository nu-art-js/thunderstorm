import {sortArray, TypedMap} from '@nu-art/ts-common';
import {SearchSorter} from '../../../_core/SearchSorter';
import {AddOnDef_SearchTerm} from '../../add-ons/search-term';

enum SortScore {
	ExactMatch,
	StartsWith,
	Includes,
}

export const SearchSorter_SearchTerm: SearchSorter<AddOnDef_SearchTerm> = {
	key: 'searchTerm',
	sortFunction: (value, results) => {
		if (!value)
			return;

		const scoreMap = results.reduce((map, result) => {
			const resultValue = result.filterResults[SearchSorter_SearchTerm.key] as AddOnDef_SearchTerm['itemParam'];
			if (resultValue === value)
				map[result.id] = SortScore.ExactMatch;
			else if (resultValue.startsWith(value))
				map[result.id] = SortScore.StartsWith;
			else
				map[result.id] = SortScore.Includes;
			return map;
		}, {} as TypedMap<SortScore>);

		sortArray(results, result => (result.filterResults[SearchSorter_SearchTerm.key] as AddOnDef_SearchTerm['itemParam']).length);

		sortArray(results, result => scoreMap[result.id]);
	}
};