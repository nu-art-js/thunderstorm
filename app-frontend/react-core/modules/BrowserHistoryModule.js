/**
 * Created by tacb0ss on 27/07/2018.
 */
import Module from '../core/Module';
import createHistory from 'history/createBrowserHistory';
import qs from 'query-string';

class BrowserHistoryModule
	extends Module {

	constructor() {
		super();
		this.history = createHistory();
	}

	push(push) {
		this.history.push(push);
	}

	setUrl(url) {
		this.logDebug(`setting url: ${url}`);
		this.push({pathname: url});
	}

	setQuery(url, query) {
		const searchString = qs.stringify(query);
		const data = {
			pathname: url ? url : this.getCurrent().pathname,
			search: searchString
		};

		this.push(data);
	}

	getQueryParams() {
		return qs.parse(this.getCurrent().search);
	}

	getCurrent() {
		return this.history.location;
	}

	getHistory() {
		return this.history;
	}
}

export default new BrowserHistoryModule();
