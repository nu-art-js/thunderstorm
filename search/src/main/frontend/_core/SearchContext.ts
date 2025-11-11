import {arrayIncludesAll, BadImplementationException, DBPointer, Debounce, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef} from './SearchAddOn';
import {SearchItem} from './SearchItem';

export interface SearchAddOnRenderer {
	__onSearchFilterChanged: VoidFunction;
	readonly addOn: SearchAddOn<any>;
}

export class SearchContext
	extends Logger {

	private readonly searchItems: SearchItem<any, any>[];
	private readonly addOns: SearchAddOn<any>[];
	private readonly filterDictionary: { [AddOnKey: string]: any } = {};
	private readonly _filterChangeListeners: SearchAddOnRenderer[] = [];
	private readonly searchDebouncer = new Debounce(() => this.search(), 500, 1000);

	constructor(key: string, searchItems: SearchItem<any, any>[], addOns: SearchAddOn<any>[]) {
		super(`SearchContext-${key}`);
		this.searchItems = searchItems;
		this.addOns = addOns;
	}

	//######################### Internal Logic #########################

	private getInitialSearchResults = (activeAddOns: SearchAddOn<any>[]): DBPointer[] => {
		const results: DBPointer[] = [];
		const addOnKeys = activeAddOns.map(addOn => addOn.key);
		this.searchItems.forEach(searchItem => {
			if (!arrayIncludesAll(searchItem.compatibleAddOnKeys as string[], addOnKeys))
				return;
			const pointers: DBPointer[] = searchItem.module.cache.all().map(i => ({dbKey: searchItem.module.dbDef.dbKey, id: i._id}));
			results.push(...pointers);
		});
		return results;
	};

	private getActiveAddOns = () => {
		return this.addOns.filter(addOn => {
			const currentValue = this.filterDictionary[addOn.key];
			return addOn.isActive(currentValue);
		});
	};

	private search = () => {
		const addons = this.getActiveAddOns();
		const searchResults = this.getInitialSearchResults(addons);
		this.logInfo('searchResults', searchResults);
	};

	//######################### Public Logic #########################

	public filter = {
		set: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key'], value: AddOn['param']): void => {
			this.filterDictionary[key] = value;
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
			if (!addOn)
				throw new BadImplementationException('Trying to ');

			this._filterChangeListeners.push(renderer);
		},
		unregister: (renderer: SearchAddOnRenderer) => {
			removeItemFromArray(this._filterChangeListeners, renderer);
		}
	};

	public test_TriggerSearch = () => this.searchDebouncer.trigger();
}