import {sortArray} from '@nu-art/ts-common';
import {SearchSorter} from '../../../_core/SearchSorter.js';
import {AddOnDef_Label} from '../../add-ons/label/types.js';

export const SearchSorter_Label: SearchSorter<AddOnDef_Label> = {
	key: 'label',
	sortFunction: (results) => {
		sortArray(results, result => result.filterResults[SearchSorter_Label.key].value);
	}
};