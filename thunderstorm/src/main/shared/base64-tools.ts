import {StaticLogger, TS_Object} from '@nu-art/ts-common';

export function convertBase64ToObject<T extends TS_Object>(base64: string): T {
	try {
		// Check if running in the browser
		const isBrowser = typeof window !== 'undefined' && typeof window.atob === 'function';
		const decoded = isBrowser
			? window.atob(base64) // Browser: Use `atob`
			: Buffer.from(base64, 'base64').toString('utf-8'); // Node.js: Use `Buffer`

		return JSON.parse(decoded);
	} catch (err: any) {
		StaticLogger.logError(err);
		return {} as T; // Return an empty object of type T on failure
	}
}