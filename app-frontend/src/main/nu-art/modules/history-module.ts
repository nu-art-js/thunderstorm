/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Module} from "@nu-art/core";
import createBrowserHistory from "history/createBrowserHistory";
import {History, LocationDescriptorObject, Search} from "history";
import {parse, stringify} from "qs";

export class BrowserHistoryModule
	extends Module<void> {
	private readonly history: History<any>;

	constructor() {
		super();
		this.history = createBrowserHistory();
	}

	push(push: LocationDescriptorObject) {
		this.history.push(push);
	}

	setUrl(url: string) {
		this.logDebug(`setting url: ${url}`);
		this.push({pathname: url});
	}

	setQuery(url: string, query: Search) {
		const searchString = stringify(query);
		const data = {
			pathname: url ? url : this.getCurrent().pathname,
			search: searchString
		};

		this.push(data);
	}

	getQueryParams() {
		return parse(this.getCurrent().search);
	}

	getCurrent() {
		return this.history.location;
	}

	getHistory() {
		return this.history;
	}
}
