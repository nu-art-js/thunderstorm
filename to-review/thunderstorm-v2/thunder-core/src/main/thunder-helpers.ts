/*
 * Thunderstorm is a full web app framework!
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

const toMB = (x: number) => (x / (1024 * 1024)).toFixed(1);
const toGB = (x: number) => (x / (1024 * 1024 * 1024)).toFixed(2);

export const getBrowseAndDeviceLogs = () => {
	console.error('Browse & Device info');
	const uad = (navigator as { userAgentData?: { brands?: { brand: string; version: string }[] } }).userAgentData ?? null;
	const brands = uad?.brands
		? uad.brands.map((b) => `${b.brand} ${b.version}`).join(', ')
		: null;
	const ua = navigator.userAgent ?? '';
	const chromeMatch = ua.match(/Chrome\/(\d+)\./);

	console.warn('UserAgent:', ua);
	if (brands) console.warn('UA Brands:', brands);
	if (chromeMatch) console.warn('Chrome major:', Number(chromeMatch[1]));
	console.warn('Platform:', navigator.platform);
	console.warn('Language(s):', navigator.languages);
	console.warn('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
	console.warn('Screen:', {
		width: screen.width,
		height: screen.height,
		availWidth: screen.availWidth,
		availHeight: screen.availHeight,
		pixelRatio: window.devicePixelRatio
	});
	const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
	console.warn('Hardware:', {
		cores: navigator.hardwareConcurrency,
		memoryGB: (deviceMemory ?? 'n/a')
	});
	const nav = navigator as { connection?: object; webkitConnection?: object; mozConnection?: object };
	const conn = nav.connection ?? nav.webkitConnection ?? nav.mozConnection;
	if (conn) {
		console.warn('Network (conn):', conn);
	}
};

export const getJSEngineLogs = () => {
	console.error('JS engine');
	console.warn('JS Engine hints:', {
		hasChromeObj: !!(window as { chrome?: unknown }).chrome,
		crossOriginIsolated: window.crossOriginIsolated,
		sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
		wasm: typeof WebAssembly !== 'undefined'
	});
	const perf = performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } };
	if (perf?.memory) {
		const m = perf.memory;
		console.warn('JS Heap:', {
			usedBytes: m.usedJSHeapSize,
			totalBytes: m.totalJSHeapSize,
			limitBytes: m.jsHeapSizeLimit,
			usedMB: toMB(m.usedJSHeapSize),
			totalMB: toMB(m.totalJSHeapSize),
			limitGB: toGB(m.jsHeapSizeLimit)
		});
	}
};

export const getECMADataLog = () => {
	console.error('ECMAScript feature support');
	const esSupport = {
		ES2015: ('Promise' in globalThis && 'Map' in globalThis),
		ES2016: ('includes' in Array.prototype),
		ES2017: ('values' in Object),
		ES2018: ('finally' in Promise.prototype),
		ES2019: ('flat' in Array.prototype),
		ES2020: ('BigInt' in globalThis),
		ES2021: ('any' in Promise),
		ES2022: ('at' in Array.prototype),
		ES2023: ('findLast' in Array.prototype),
		ES2024: ('toSorted' in Array.prototype)
	};
	const highestES = Object.entries(esSupport).reduce((acc, [k, ok]) => (ok ? k : acc), 'unknown');
	console.warn('Detected ES features:', esSupport);
	console.warn('Approx. ECMAScript level:', highestES);
};

export const getiFrameLog = () => {
	console.error('iFrame context');
	const inIframe = window.top !== window;
	console.warn('In iFrame:', inIframe);
	if (inIframe) {
		let sameOriginParent: boolean;
		try {
			void (parent as Window).location.hostname;
			sameOriginParent = true;
		} catch {
			sameOriginParent = false;
		}
		try {
			const el = window.frameElement;
			console.warn('Frame element:', {
				id: el?.id ?? null,
				width: (el as HTMLElement | null)?.clientWidth,
				height: (el as HTMLElement | null)?.clientHeight,
				sandbox: (el as HTMLIFrameElement | null)?.getAttribute?.('sandbox'),
				allow: (el as HTMLIFrameElement | null)?.getAttribute?.('allow'),
				referrerpolicy: (el as HTMLIFrameElement | null)?.getAttribute?.('referrerpolicy'),
				sameOriginParent
			});
		} catch (e) {
			console.error('FrameElement not accessible (cross-origin)', e);
		}
	}
};

export const navigationTimingLog = () => {
	console.error('Navigation timing');
	const nav = performance.getEntriesByType?.('navigation')?.[0];
	console.warn('Navigation timing:', nav ? ((nav as { toJSON?: () => object }).toJSON?.() ?? nav) : 'n/a');
};

export const globalErrorListener = () => {
	window.addEventListener('error', (e) => {
		console.error('Global Error:', e.message, e.filename, e.lineno, e.colno, e.error);
	});
	window.addEventListener('unhandledrejection', (e) => {
		console.error('Unhandled Promise rejection:', e.reason);
	});
};

export const indexedDBAsyncCheckLog = () => {
	console.error('IndexedDB async check');
	if (!('indexedDB' in window)) {
		console.warn('IndexedDB: not supported in this environment');
		return;
	}
	const t0 = performance.now();
	const order: string[] = ['start'];
	const dbName = `logger-idb-test-${Math.random().toString(36).slice(2)}`;
	try {
		const req = indexedDB.open(dbName, 1);
		order.push('after open() return');
		Promise.resolve().then(() => order.push('microtask (Promise.then)'));
		setTimeout(() => order.push('macrotask (setTimeout 0)'), 0);
		req.onupgradeneeded = () => {
			order.push('onupgradeneeded');
		};
		req.onerror = () => {
			console.error('IndexedDB open error:', req.error);
			console.warn('IndexedDB event order (error path):', order);
		};
		req.onsuccess = () => {
			order.push('onsuccess');
			const delayMs = Math.round(performance.now() - t0);
			console.warn('IndexedDB event order:', order);
			console.warn('IndexedDB open async delay (ms):', delayMs);
			console.warn('IndexedDB fires synchronously:', false);
			try {
				req.result.close();
				indexedDB.deleteDatabase(dbName);
			} catch {
			}
		};
	} catch (e) {
		console.error('IndexedDB open threw synchronously:', e);
	}
};
