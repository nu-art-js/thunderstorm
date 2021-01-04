/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

export class Filter {
	private _filter = "";

	setFilter(filter: string) {
		this._filter = filter;
	}

	getFilter(filter: string) {
		this._filter = filter;
	}

	filter<T>(items: T[], filter: (item: T) => string[]): T[] {
		const filterAsRegexp = this.prepareFilter();

		return items.filter((item) => {
			const keysToFilter = filter(item);
			for (const key of keysToFilter) {
				if (key.toLowerCase().match(filterAsRegexp))
					return true;
			}

			return false;
		});
	}

	private prepareFilter() {
		let filter = this._filter;
		filter = filter.trim();
		filter = filter.toLowerCase();
		filter = filter.replace(/\s+/, " ");
		filter = filter.replace(new RegExp("(.)", "g"), ".*?$1");
		filter.length === 0 ? filter = ".*?" : filter += ".*";

		return new RegExp(filter);
	}
}