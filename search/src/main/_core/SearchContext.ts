import {arrayIncludesAll, BadImplementationException, Debounce, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef, SearchResult} from './SearchAddOn.js';
import {SearchItem} from './SearchItem.js';
import {SearchSorter} from './SearchSorter.js';
import {StorageKey, Thunder} from '@nu-art/thunderstorm-frontend';
import {OnSyncStatusChangedListener} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';

export interface SearchAddOnRenderer {
	__onSearchFilterChanged: VoidFunction;
	readonly addOn: SearchAddOn<any>;
}

export interface SearchResultsRenderer {
	__onSearchResultsChanged: VoidFunction;
}

export class SearchContext
	extends Logger
	implements OnSyncStatusChangedListener<any> {

	private searchItems: SearchItem<any, any>[];
	private activeSearchItems: SearchItem<any, any>[];
	private addOns: SearchAddOn<any>[];
	private activeAddOns: SearchAddOn<any>[];
	private sorters: SearchSorter<any>[];

	private minimumRequiredActiveAddons: number = 0;
	private readonly searchDebouncer = new Debounce(() => this.search(), 200, 500);
	private saveFilterDebounce: Debounce<any, any> | undefined;
	private readonly filterDictionary: { [AddOnKey: string]: any };
	private readonly _filterChangeListeners: SearchAddOnRenderer[] = [];
	private searchResults?: SearchResult[];
	private searchTime?: number;
	private readonly _searchResultChangeListeners: SearchResultsRenderer[] = [];
	private _retainFilters: boolean = false;
	private readonly filterStorage: StorageKey<{ [AddOnKey: string]: any }>;

	constructor(key: string) {
		super(`SearchContext-${key}`);
		this.searchItems = [];
		this.activeSearchItems = [];
		this.addOns = [];
		this.activeAddOns = [];
		this.sorters = [];
		this.filterStorage = new StorageKey(`search-context-data__${key}`);
		this.filterDictionary = this.filterStorage.get({});
		//Register listeners with a delay to let Thunder instance be created
		setTimeout(() => {
			// @ts-ignore
			Thunder.getInstance().addUIListener(this);
			this.searchItems.forEach(searchItem => {
				// @ts-ignore
				this[searchItem.module.defaultDispatcher.method] = () => this.searchDebouncer.trigger();
			});
		});
	}

	__onSyncStatusChanged = () => this.searchDebouncer.trigger();

	//######################### Factory Logic #########################

	public setSearchItems = (items: SearchItem<any, any>[]) => {
		this.searchItems = items;
		this.setActiveSearchItems();
		this.logInfo('Set Search Items', this.searchItems);
		return this;
	};

	public setAddOns = (addOns: SearchAddOn<any>[]) => {
		this.addOns = addOns;
		this.setActiveAddOns();
		this.setActiveSearchItems();
		return this;
	};

	public setSorters = (sorters: SearchSorter<any>[]) => {
		this.sorters = sorters;
		return this;
	};

	public setMinimumRequiredActiveAddOns = (num: number) => {
		this.minimumRequiredActiveAddons = num;
		return this;
	};

	public retainFilters = () => {
		this._retainFilters = true;
		this.saveFilterDebounce = new Debounce(() => this.saveFilters(), 200, 500);
		return this;
	};

	//######################### Internal Logic #########################

	private setActiveAddOns = () => {
		this.activeAddOns = this.addOns.filter(addOn => {
			const currentValue = this.filterDictionary[addOn.key];
			return addOn.isActive(currentValue);
		});
	};

	private setActiveSearchItems = () => {
		const activeAddOnKeys = this.activeAddOns.map(addOn => addOn.key);
		if (!activeAddOnKeys.length)
			return this.activeSearchItems = [...this.searchItems];

		this.activeSearchItems = this.searchItems.filter(searchItem => arrayIncludesAll(searchItem.compatibleAddOnKeys as string[], activeAddOnKeys));
	};

	private getInitialSearchResults = (): SearchResult[] => {
		const results: SearchResult[] = [];
		this.activeSearchItems.forEach(searchItem => {
			const pointers: SearchResult[] = searchItem.module.cache.all().map(i => ({dbKey: searchItem.module.dbDef.dbKey, id: i._id, filterResults: {}}));
			results.push(...pointers);
		});
		return results;
	};

	private search = () => {
		if (this.activeAddOns.length < this.minimumRequiredActiveAddons) {
			if (this.addOns.length) {
				delete this.searchResults;
				delete this.searchTime;
				this._searchResultChangeListeners.forEach(listener => listener.__onSearchResultsChanged());
			}
			return;
		}

		const startTime = Date.now();
		let searchResults = this.getInitialSearchResults();
		//Map active search item to dbKeys for O(1) access
		const searchItemMap = this.activeSearchItems.reduce((map, item) => {
			map[item.module.dbDef.dbKey] = item;
			return map;
		}, {} as { [key: string]: SearchItem<any, any> });

		//Cycle filter the results by active add-ons
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

		//Sort results
		this.sorters.forEach(sorter => {
			const addOn = this.activeAddOns.find(addOn => addOn.key === sorter.key);
			if (!addOn) //No connected active addon was found, do not run sorter
				return;

			sorter.sortFunction(searchResults);
		});

		this.searchResults = searchResults;
		this.searchTime = Date.now() - startTime;
		this._searchResultChangeListeners.forEach(listener => listener.__onSearchResultsChanged());
	};

	private saveFilters = () => {
		if (!this._retainFilters)
			return;

		this.filterStorage.set({...this.filterDictionary});
	};

	//######################### Public Logic #########################

	public getActiveSearchItems = () => [...this.activeSearchItems];

	public getSearchResults = () => this.searchResults;

	public getSearchTime = () => this.searchTime;

	public getAddOns = () => [...this.addOns];

	public filter = {
		set: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key'], value: AddOn['valueType']): void => {
			this.filterDictionary[key] = value;
			this.saveFilterDebounce?.trigger();
			this.saveFilters();
			//Re-calculate active addons and search items
			this.setActiveAddOns();
			this.setActiveSearchItems();
			//Notify all listeners that filters have changed
			this._filterChangeListeners.forEach(listener => listener.__onSearchFilterChanged());
			//Trigger search
			this.searchDebouncer.trigger();
		},
		get: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key']): AddOn['valueType'] | undefined => {
			return this.filterDictionary[key];
		},
	};

	public filterChangeListeners = {
		register: (renderer: SearchAddOnRenderer) => {
			if (this._filterChangeListeners.includes(renderer))
				return;

			const addOn = this.addOns.find(addOn => addOn.key === renderer.addOn.key);
			if (!addOn) {
				this.logError(renderer, this.addOns);
				throw new BadImplementationException('Trying to register a listener that is not connected to an addon');
			}

			this._filterChangeListeners.push(renderer);
		},
		unregister: (renderer: SearchAddOnRenderer) => {
			removeItemFromArray(this._filterChangeListeners, renderer);
		}
	};

	public searchResultChangeListeners = {
		register: (renderer: SearchResultsRenderer) => {
			if (this._searchResultChangeListeners.includes(renderer))
				return;

			this._searchResultChangeListeners.push(renderer);
		},
		unregister: (renderer: SearchResultsRenderer) => {
			removeItemFromArray(this._searchResultChangeListeners, renderer);
		}
	};
}