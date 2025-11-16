import {SearchAddOnDef, SearchResult} from './SearchAddOn';

export type SearchSorter<AddOnDef extends SearchAddOnDef<string, any, string, any>> = {
	key: AddOnDef['key'],
	sortFunction: (currentValue: AddOnDef['param'], results: SearchResult[]) => void;
}