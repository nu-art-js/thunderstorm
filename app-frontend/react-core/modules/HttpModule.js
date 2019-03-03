/**
 * Created by tacb0ss on 27/07/2018.
 */
import Module from '../core/Module';
class HttpRequest {
	constructor(origin) {
		this.origin = origin;
		this.headers = {};
	}

	setMethod(method) {
		this.method = method;
		return this;
	}

	setUrl(url) {
		this.url = url;
		return this;
	}

	setTimeout(timeout) {
		this.timeout = timeout;
		return this;
	}

	setHeaders(headers) {
		if (!headers)
			return this;

		Object.keys(headers).forEach((key) => this.setHeader(key, headers[key]));
		return this;
	}

	addHeaders(headers) {
		if (!headers)
			return this;

		Object.keys(headers).forEach((key) => this.addHeader(key, headers[key]));
		return this;
	}

	setHeader(key, value) {
		this.headers[key] = undefined;
		return this.addHeader(key, value);
	}

	addHeader(key, value) {
		this._addHeaderImpl(key, value);
	}

	_addHeaderImpl(key, value) {
		if (!value.isString() && !Array.isArray(value))
			throw new Error("header value MUST be a string or an array");

		const headers = this.headers[key];

		if (!headers)
			this.headers[key] = Array.isArray(value) ? value : [value];
		else
			this.headers[key].push(value);

		return this;
	}

	setJsonData(data) {
		this.data = JSON.stringify(data);
		this.setHeaders({"content-type": "application/json"});
		return this;
	}

	setData(data) {
		this.data = data;
		return this;
	}

	execute(onCompleted) {
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) {
				return;
			}

			onCompleted(undefined, xhr);
		};

		xhr.onerror = (err) => {
			if (xhr.readyState === 4 && xhr.status === 0) {
				let xhrWrap = {
					status: 404,
					url: this.url
				};
				onCompleted(undefined, xhrWrap)
				return;
			}

			onCompleted(err, xhr);
		};

		xhr.ontimeout = (err) => {
			onCompleted(err, xhr);
		};

		xhr.open(this.method, this.url.startsWith("http") ? this.url : this.origin + this.url);
		Object.keys(this.headers).forEach((key) => {
			xhr.setRequestHeader(key, this.headers[key]);
		});

		xhr.send(this.data);
	}

}

class HttpModule
	extends Module {

	constructor() {
		super();

		// Seems like a decent hack from here: https://stackoverflow.com/a/26725823/348189
		const xhrProto = XMLHttpRequest.prototype,
			origOpen = xhrProto.open;

		xhrProto.open = function (method, url) {
			this.url = url;
			return origOpen.apply(this, arguments);
		};

	}

	init() {
		this.origin = this.config.origin;
		this.timeout = this.config.timeout || 5000;
		if (!this.origin)
			throw new Error("MUST specify server origin path, e.g. 'https://localhost:3000'");
	}

	createRequest(method) {
		return new HttpRequest(this.origin).setMethod(method).setTimeout(this.timeout);
	}

	execute(method, url, headers, data, onCompleted) {
		this.createRequest(method).setUrl(url).setHeaders(this.headers).setHeaders(headers).setJsonData(data).execute(onCompleted);
	}
}

const httpModule = new HttpModule()

export default httpModule;
