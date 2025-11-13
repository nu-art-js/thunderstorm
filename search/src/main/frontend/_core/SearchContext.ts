import {arrayIncludesAll, BadImplementationException, DBPointer, Debounce, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef} from './SearchAddOn';
import {SearchItem} from './SearchItem';

export interface SearchAddOnRenderer {
	__onSearchFilterChanged: VoidFunction;
	readonly addOn: SearchAddOn<any>;
}

export interface SearchResultsRenderer {
	__onSearchResultsChanged: VoidFunction;
}

export class SearchContext
	extends Logger {

	private searchItems: SearchItem<any, any>[];
	private activeSearchItems: SearchItem<any, any>[];
	private addOns: SearchAddOn<any>[];
	private activeAddOns: SearchAddOn<any>[];

	private minimumRequiredActiveAddons: number = 0;
	private readonly searchDebouncer = new Debounce(() => this.search(), 200, 500);
	private readonly filterDictionary: { [AddOnKey: string]: any } = {};
	private readonly _filterChangeListeners: SearchAddOnRenderer[] = [];
	private searchResults?: DBPointer[];
	private searchTime?: number;
	private readonly _searchResultChangeListeners: SearchResultsRenderer[] = [];

	constructor(key: string) {
		super(`SearchContext-${key}`);
		this.searchItems = [];
		this.activeSearchItems = [];
		this.addOns = [];
		this.activeAddOns = [];
	}

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

	public setMinimumRequiredActiveAddOns = (num: number) => {
		this.minimumRequiredActiveAddons = num;
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

	private getInitialSearchResults = (): DBPointer[] => {
		const results: DBPointer[] = [];
		this.activeSearchItems.forEach(searchItem => {
			const pointers: DBPointer[] = searchItem.module.cache.all().map(i => ({dbKey: searchItem.module.dbDef.dbKey, id: i._id}));
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
		const searchItemMap = this.activeSearchItems.reduce((map, item) => {
			map[item.module.dbDef.dbKey] = item;
			return map;
		}, {} as { [key: string]: SearchItem<any, any> });
		this.activeAddOns.forEach(addOn => {
			const currentParam = this.filterDictionary[addOn.key];
			searchResults = searchResults.filter(result => {
				const searchItem = searchItemMap[result.dbKey];
				const itemParam = searchItem.addOnMethods[addOn.methodName](result);
				return addOn.valueFilter(currentParam, itemParam);
			});
		});
		this.searchResults = searchResults;
		this._searchResultChangeListeners.forEach(listener => listener.__onSearchResultsChanged());
		this.searchTime = Date.now() - startTime;
	};

	//######################### Public Logic #########################

	public getActiveSearchItems = () => [...this.activeSearchItems];

	public getSearchResults = () => this.searchResults;

	public getSearchTime = () => this.searchTime;

	public filter = {
		set: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key'], value: AddOn['param']): void => {
			this.filterDictionary[key] = value;
			//Re-calculate active addons and search items
			this.setActiveAddOns();
			this.setActiveSearchItems();
			//Notify all listeners that filters have changed
			this._filterChangeListeners.forEach(listener => listener.__onSearchFilterChanged());
			//Trigger search
			this.searchDebouncer.trigger();
		},
		get: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key']): AddOn['param'] | undefined => {
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