import {__stringify} from './tools';

export function isValidJson(_string: string) {
	try {
		JSON.parse(_string);
		return true;
	} catch (e) {
		return false;
	}
}

export function prettifyJson<T extends object | string>(obj?: T) {
	return __stringify<T>(obj, true);
}