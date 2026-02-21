import {arrayIncludesAll, BadImplementationException, Debounce, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef, SearchResult} from './SearchAddOn.js';
import {SearchItem} from './SearchItem.js';
import {SearchSorter} from './SearchSorter.js';
import {StorageKey} from '@nu-art/thunder-core';

export interface SearchAddOnRenderer {
	__onSearchFilterChanged: VoidFunction;
	readonly addOn: SearchAddOn<any>;
}

export interface SearchResultsRenderer {
	__onSearchResultsChanged: VoidFunction;
}

export class SearchContext
	extends Logger {

	private searchItems: SearchItem<any, any>[] = [];
	private activeSearchItems: SearchItem<any, any>[] = [];
	private addOns: SearchAddOn<any>[] = [];
	private activeAddOns: SearchAddOn<any>[] = [];
	private sorters: SearchSorter<any>[] = [];

	private minimumRequiredActiveAddons = 0;
	private readonly searchDebouncer = new Debounce(() => this.search(), 200, 500);
	private saveFilterDebounce: Debounce<any, any> | undefined;
	private readonly filterDictionary: { [AddOnKey: string]: any };
	private readonly filterChangeListenersList: SearchAddOnRenderer[] = [];
	private searchResults?: SearchResult[];
	private searchTime?: number;
	private readonly searchResultChangeListenersList: SearchResultsRenderer[] = [];
	private retainFiltersFlag = false;
	private readonly filterStorage: StorageKey<{ [AddOnKey: string]: any }>;

	constructor(key: string) {
		super(`SearchContext-${key}`);
		this.filterStorage = new StorageKey(`search-context-data__${key}`);
		this.filterDictionary = this.filterStorage.get({});
	}

	/** Call this when sync/data changes to re-run search. App is responsible for wiring. */
	__onSyncStatusChanged = () => this.searchDebouncer.trigger();

	setSearchItems = (items: SearchItem<any, any>[]) => {
		this.searchItems = items;
		this.setActiveSearchItems();
		this.logInfo('Set Search Items', this.searchItems);
		return this;
	};

	setAddOns = (addOns: SearchAddOn<any>[]) => {
		this.addOns = addOns;
		this.setActiveAddOns();
		this.setActiveSearchItems();
		return this;
	};

	setSorters = (sorters: SearchSorter<any>[]) => {
		this.sorters = sorters;
		return this;
	};

	setMinimumRequiredActiveAddOns = (num: number) => {
		this.minimumRequiredActiveAddons = num;
		return this;
	};

	retainFilters = () => {
		this.retainFiltersFlag = true;
		this.saveFilterDebounce = new Debounce(() => this.saveFilters(), 200, 500);
		return this;
	};

	private setActiveAddOns = () => {
		this.activeAddOns = this.addOns.filter(addOn => {
			const currentValue = this.filterDictionary[addOn.key];
			return addOn.isActive(currentValue);
		});
	};

	private setActiveSearchItems = () => {
		const activeAddOnKeys = this.activeAddOns.map(addOn => addOn.key);
		if (!activeAddOnKeys.length)
			return void (this.activeSearchItems = [...this.searchItems]);

		this.activeSearchItems = this.searchItems.filter(searchItem =>
			arrayIncludesAll(searchItem.compatibleAddOnKeys as string[], activeAddOnKeys));
	};

	private getInitialSearchResults = (): SearchResult[] => {
		const results: SearchResult[] = [];
		this.activeSearchItems.forEach(searchItem => {
			const all = searchItem.module.cache.all();
			const pointers: SearchResult[] = all.map(i => ({
				dbKey: searchItem.module.config.dbKey,
				id: (i as { _id: string })._id,
				filterResults: {}
			}));
			results.push(...pointers);
		});
		return results;
	};

	private search = () => {
		if (this.activeAddOns.length < this.minimumRequiredActiveAddons) {
			if (this.addOns.length) {
				delete this.searchResults;
				delete this.searchTime;
				this.searchResultChangeListenersList.forEach(listener => listener.__onSearchResultsChanged());
			}
			return;
		}

		const startTime = Date.now();
		let searchResults = this.getInitialSearchResults();
		const searchItemMap = this.activeSearchItems.reduce((map, item) => {
			map[item.module.config.dbKey] = item;
			return map;
		}, {} as { [key: string]: SearchItem<any, any> });

		this.activeAddOns.forEach(addOn => {
			const filterValue = this.filterDictionary[addOn.key];
			searchResults = searchResults.filter(result => {
				const searchItem = searchItemMap[result.dbKey];
				result.filterResults[addOn.key] = {value: searchItem.addOnMethods[addOn.methodName](result)};
				const filterResult = addOn.resultFilter(filterValue, result);
				result.filterResults[addOn.key].score = filterResult.score;
				return filterResult.pass;
			});
		});

		this.sorters.forEach(sorter => {
			const addOn = this.activeAddOns.find(a => a.key === sorter.key);
			if (!addOn)
				return;
			sorter.sortFunction(searchResults);
		});

		this.searchResults = searchResults;
		this.searchTime = Date.now() - startTime;
		this.searchResultChangeListenersList.forEach(listener => listener.__onSearchResultsChanged());
	};

	private saveFilters = () => {
		if (!this.retainFiltersFlag)
			return;
		this.filterStorage.set({...this.filterDictionary});
	};

	getActiveSearchItems = () => [...this.activeSearchItems];

	getSearchResults = () => this.searchResults;

	getSearchTime = () => this.searchTime;

	getAddOns = () => [...this.addOns];

	filter = {
		set: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key'], value: AddOn['valueType']): void => {
			this.filterDictionary[key] = value;
			this.saveFilterDebounce?.trigger();
			this.saveFilters();
			this.setActiveAddOns();
			this.setActiveSearchItems();
			this.filterChangeListenersList.forEach(listener => listener.__onSearchFilterChanged());
			this.searchDebouncer.trigger();
		},
		get: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key']): AddOn['valueType'] | undefined =>
			this.filterDictionary[key],
	};

	filterChangeListeners = {
		register: (renderer: SearchAddOnRenderer) => {
			if (this.filterChangeListenersList.includes(renderer))
				return;
			const addOn = this.addOns.find(a => a.key === renderer.addOn.key);
			if (!addOn) {
				this.logError(renderer, this.addOns);
				throw new BadImplementationException('Trying to register a listener that is not connected to an addon');
			}
			this.filterChangeListenersList.push(renderer);
		},
		unregister: (renderer: SearchAddOnRenderer) => {
			removeItemFromArray(this.filterChangeListenersList, renderer);
		},
	};

	searchResultChangeListeners = {
		register: (renderer: SearchResultsRenderer) => {
			if (this.searchResultChangeListenersList.includes(renderer))
				return;
			this.searchResultChangeListenersList.push(renderer);
		},
		unregister: (renderer: SearchResultsRenderer) => {
			removeItemFromArray(this.searchResultChangeListenersList, renderer);
		},
	};
}
