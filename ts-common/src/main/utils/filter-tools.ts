/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * # Filter
 *
 * ## <ins>Intro:</ins>
 *
 * A filter tool for filtering a collection or testing items by comparing string values</br>
 * This tool aims to simplify filtering arrays of strings or objects containing string fields
 * by defining which fields are tested (via a mapper function) testing those fields against a string
 *
 * ## <ins>Example data:</ins>
 *
 * type T in the following examples will be:
 *
 * ```js
 * type T = {
 *   name: string;
 * }
 * ```
 *
 * items:
 * ```js
 * const item1: T = {name: 'Matan'};
 * const item2: T = {name: 'Adam'};
 * const item3: T = {name: 'Itay'};
 * const items: T[] = [item1, item2, item3];
 * ```
 */
export class Filter<T> {
	private regexp = true;
	private readonly mapper: (item: T) => string[];
	private originFilterText?: string;
	private _filter!: RegExp;

	/**
	 * Returns an instance of a filter, where the tested fields are the one provided by the mapper.
	 *
	 * @param mapper a function that returns a string array
	 *
	 * @return
	 *
	 * #### <ins>Usage:</ins>
	 * ```js
	 * //Prepares a filter instance where tests are run on the item.name
	 * const filter = new Filter<T>((item)=>[item.name]);
	 * ```
	 */
	constructor(mapper: (item: T) => string[]) {
		this.mapper = mapper;
	}

	/**
	 * A function to set the Filter.regexp boolean flag
	 *
	 * @param regexp
	 * </br>
	 * @returns - the Filter instance
	 * </br></br>
	 *
	 * #### <ins>Usage:</ins>
	 * ```js
	 * const filter = new Filter().setRegexp(false);
	 * ```
	 *
	 */
	setRegexp(regexp: boolean) {
		this.regexp = regexp;
		delete this.originFilterText;
		return this;
	}

	/**
	 * A function returning a boolean value for if the item passes the filter</br>
	 * The function checks the item fields (based on the mapper given when the Filter instance was created) against the filterText argument
	 *
	 * @param item The item to check
	 * @param filterText A string to filter by
	 *
	 * @return
	 *
	 * </br>
	 *
	 * #### <ins>Usage:</ins>
	 * ```js
	 * const item: T = {name: 'Matan'}
	 *
	 * //Will print 'true'
	 * console.log(filter.filterItem(item, 'Matan'))
	 *
	 * //Will print 'false'
	 * console.log(filter.filterItem(item, 'Adam'))
	 * ```
	 */
	filterItem(item: T, filterText: string): boolean {
		this.prepareFilter(filterText);
		return this.filterImpl(item);
	}

	/**
	 * A function returning an array of items that pass the filter</br>
	 * The function checks each item's fields (based on the mapper given when the Filter instance was created) against the filterText argument.
	 *
	 * @param items An array of items to check
	 * @param filterText - A string to filter by
	 *
	 * @return
	 *
	 * </br>
	 *
	 * #### <ins>Usage:</ins>
	 * ```js
	 * //Will return [item2]
	 * const filteredItems = filter.filter(items,'Adam');
	 * ```
	 */
	filter(items: T[], filterText: string): T[] {
		this.prepareFilter(filterText);
		return items.filter(this.filterImpl);
	}

	filterSort(items: T[], filterText: string): T[] {
		this.prepareFilter(filterText);
		const exactMatches: T[] = [];
		const partialMatches: T[] = [];
		const regexMatches: T[] = [];
		const text = filterText.toLowerCase();

		items.forEach(item => {
			if (!this.filterImpl(item))
				return;

			const values = this.mapper(item).map(value => value.toLowerCase());

			//Exact Match
			if (values.includes(text)) {
				exactMatches.push(item);
				return;
			}

			//Substring Match
			for (const value of values) {
				if (value.includes(text)) {
					partialMatches.push(item);
					return;
				}
			}
			
			//Regex Match
			regexMatches.push(item);
		});

		return [...exactMatches, ...partialMatches, ...regexMatches];
	}

	/**
	 * A function return a boolean value as to if any of the item fields passes the Filter._filter</br>
	 * Regular expression set by the "setRegexp" function.</br>
	 * This function serves as a "default mapper" to pass to a prototype.filter function instead of using this Filter functionality.
	 *
	 * @param item The item to check
	 *
	 * @return
	 *
	 * #### <ins>Usage:</ins>
	 * ```js
	 * const filter = new Filter();
	 *
	 * filter.prepareFilter('REGEX');
	 *
	 * const filteredItems = [item1,item2,item3].filter(filter.filterImpl);
	 * ```
	 */
	filterImpl = (item: T) => {
		const keysToFilter = this.mapper(item);
		for (const key of keysToFilter) {
			if (key.toLowerCase().match(this._filter))
				return true;
		}

		return false;
	};

	/**
	 * A function that sets the Filter instance's filter text and regex.
	 *
	 * @param filter a filter string
	 *
	 * @returns - the Filter instance
	 *
	 * #### <ins>Usage:</ins>
	 * ```js
	 * const filter = new Filter().prepareFilter('REGEX');
	 * ```
	 */
	prepareFilter(filter?: string) {
		if (this.originFilterText === filter)
			return this;

		filter = (filter || '').trim();
		filter = filter.toLowerCase();
		filter = filter.replace(/\s+/, ' ');
		if (this.regexp) {
			filter = filter.replace(new RegExp('(.)', 'g'), '.*?$1');
		} else {
			filter = `.*?${filter}`;
		}
		filter.length === 0 ? filter = '.*?' : filter += '.*';

		this.originFilterText = filter;
		this._filter = new RegExp(filter);
		return this;
	}
}