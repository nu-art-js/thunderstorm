/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export const indexedDBAsyncCheckLog = () => {
	console.error('IndexedDB async check');

	// Basic support check
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

		// Mark micro/macro task boundaries to visualize async behavior
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

			// Summary logs
			console.warn('IndexedDB event order:', order);
			console.warn('IndexedDB open async delay (ms):', delayMs);
			console.warn('IndexedDB fires synchronously:', false); // By spec, it's async.

			// Cleanup
			try {
				req.result.close();
				indexedDB.deleteDatabase(dbName);
			} catch {
			}
		};
	} catch (e) {
		// If anything throws synchronously, log it
		console.error('IndexedDB open threw synchronously:', e);
	}
};
