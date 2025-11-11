import {BadImplementationException, Logger, removeItemFromArray} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef} from './SearchAddOn';
import {SearchItem} from './SearchItem';

export type SearchAddOnRenderer = { __onSearchFilterChanged: VoidFunction };

export class SearchContext
	extends Logger {

	private readonly key: string;
	private readonly searchItems: SearchItem<any, any>[];
	private readonly filterDictionary: { [AddOnKey: string]: any };
	private readonly addOns: SearchAddOn<any>[];
	private readonly _filterChangeListeners: SearchAddOnRenderer[];

	constructor(key: string, searchItems: SearchItem<any, any>[]) {
		super(`SearchContext-${key}`);
		this.key = key;
		this.searchItems = searchItems;
		this.filterDictionary = {};
		this.addOns = [];
		this._filterChangeListeners = [];
	}

	//######################### Internal Logic #########################


	//######################### Public Logic #########################

	public filter = {
		set: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key'], value: AddOn['param']): void => {
			this.filterDictionary[key] = value;
		},
		get: <AddOn extends SearchAddOnDef<string, any, any, any>>(key: AddOn['key']): AddOn['param'] | undefined => {
			return this.filterDictionary[key];
		},

	};

	public addOn = {
		register: <AddOn extends SearchAddOn<any>>(addOn: AddOn) => {
			if (this.addOns.includes(addOn))
				return;

			if (this.addOns.find(item => item.key === addOn.key)) {
				this.logError('Trying to register more than one addon for the same key', `Context Key: ${this.key}`, `AddOn Key: ${addOn.key}`);
				throw new BadImplementationException('Error registering addon to search context');
			}

			this.addOns.push(addOn);
		},
		unregister: <AddOn extends SearchAddOn<any>>(addOn: AddOn) => {
			removeItemFromArray(this.addOns, addOn);
		}
	};

	public filterChangeListeners = {
		register: (renderer: SearchAddOnRenderer) => {
			if (this._filterChangeListeners.includes(renderer))
				return;

			this._filterChangeListeners.push(renderer);
		},
		unregister: (renderer: SearchAddOnRenderer) => {
			removeItemFromArray(this._filterChangeListeners, renderer);
		}
	};
}