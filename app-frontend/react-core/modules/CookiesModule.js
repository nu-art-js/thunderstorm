/**
 * Created by tacb0ss on 27/07/2018.
 */
import Module from '../core/Module';

const regexpSingle = new RegExp("([a-zA-Z0-9\-\._]{1,})\s*=(.*)");

class CookiesModule
	extends Module {

	constructor() {
		super();
		this.cookie = {};
	}

	getCookie() {
		return this.cookie;
	}

	getFullCookie() {
		const toRet = {};
		const cookie = document ? document.cookie || "" : "";
		const cookies = cookie.split(';');
		cookies.forEach((cookie) => {
			const temp = cookie.match(regexpSingle);
			toRet[temp[1]] = temp[2];
		});

		return toRet;
	}

	set(key, value, expiration, path) {
		this.cookie[key] = value;

		let cookie = `${key}=${!value ? "" : value};`;
		if (expiration) {
			const d = new Date();
			d.setTime(d.getTime() + expiration);
			cookie = `${cookie} expires=${d.toUTCString()};`
		}

		if (path)
			cookie = `${cookie} path=${path}`;

		document.cookie = cookie;
	}

	get(key) {
		let value = this.cookie[key];
		if (!value) {
			let cookies = (document ? document.cookie || "" : "").split(';');
			cookies = cookies.filter((cookie) => {
				return cookie.indexOf(`${key}=`) !== -1;
			});

			if (cookies.length === 0)
				value = null;
			else
				value = cookies[0].match(regexpSingle)[2];
		}

		this.cookie[key] = value;
		return value
	}
}

export default new CookiesModule();
