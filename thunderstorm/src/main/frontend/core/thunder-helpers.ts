// ---------- helpers ----------
const toMB = (x) => (x / (1024 * 1024)).toFixed(1);
const toGB = (x) => (x / (1024 * 1024 * 1024)).toFixed(2);

export const getBrowseAndDeviceLogs = () => {
	console.error("Browse & Device info");

	// @ts-ignore
	const uad = (navigator.userAgentData || null);
	const brands = uad?.brands ? uad.brands.map(b => `${b.brand} ${b.version}`).join(", ") : null;
	const ua = navigator.userAgent || "";
	const chromeMatch = ua.match(/Chrome\/(\d+)\./); // rough engine hint

	console.warn("UserAgent:", ua);
	if (brands) console.warn("UA Brands:", brands);
	if (chromeMatch) console.warn("Chrome major:", Number(chromeMatch[1]));

	console.warn("Platform:", navigator.platform);
	console.warn("Language(s):", navigator.languages);
	console.warn("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
	console.warn("Screen:", {
		width: screen.width,
		height: screen.height,
		availWidth: screen.availWidth,
		availHeight: screen.availHeight,
		pixelRatio: window.devicePixelRatio
	});
	console.warn("Hardware:", {
		cores: navigator.hardwareConcurrency,
		memoryGB: (navigator.deviceMemory ?? "n/a")
	});
	// @ts-ignore
	const conn = (navigator.connection || navigator.webkitConnection || navigator.mozConnection);
	if (conn) {
		console.warn("Network (conn):", {
			downlink: conn.downlink, effectiveType: conn.effectiveType, rtt: conn.rtt, saveData: conn.saveData
		});
	}
}

export const getJSEngineLogs = () => {
	console.error("JS engine");
	console.warn("JS Engine hints:", {
		hasChromeObj: !!window.chrome,
		crossOriginIsolated: window.crossOriginIsolated,
		sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
		wasm: typeof WebAssembly !== "undefined"
	});
	// @ts-ignore
	if (performance && performance.memory) {
		// @ts-ignore
		const m = performance.memory;
		console.warn("JS Heap:", {
			usedBytes: m.usedJSHeapSize,
			totalBytes: m.totalJSHeapSize,
			limitBytes: m.jsHeapSizeLimit,
			usedMB: toMB(m.usedJSHeapSize),
			totalMB: toMB(m.totalJSHeapSize),
			limitGB: toGB(m.jsHeapSizeLimit)
		});
	}
}

export const getECMADataLog = () => {
	console.error("ECMAScript feature support");
	// Booleans per edition (representative probes)
	const esSupport = {
		ES2015: (typeof Promise !== "undefined" && typeof Map !== "undefined"),
		ES2016: (typeof Array.prototype.includes !== "undefined"),
		ES2017: (typeof Object.values !== "undefined"),
		ES2018: (typeof Promise.prototype.finally !== "undefined"),
		ES2019: (typeof Array.prototype.flat !== "undefined"),
		ES2020: (typeof BigInt !== "undefined"),
		ES2021: (typeof Promise.any !== "undefined"),
		ES2022: (typeof Array.prototype.at !== "undefined"),
		ES2023: (typeof Array.prototype.findLast !== "undefined"),
		ES2024: (typeof Array.prototype.toSorted !== "undefined") // better 2024 probe
	};
	const highestES = Object.entries(esSupport).reduce((acc, [k, ok]) => ok ? k : acc, "unknown");
	console.warn("Detected ES features:", esSupport);
	console.warn("Approx. ECMAScript level:", highestES);
}

export const getiFrameLog = () => {
	console.error("iFrame context");
	const inIframe = window.top !== window;
	console.warn("In iFrame:", inIframe);
	if (inIframe) {
		let sameOriginParent;
		try {
			void parent.location.hostname;
			sameOriginParent = true;
		} catch {
			sameOriginParent = false;
		}
		let storageAccess = null;
		try {
			storageAccess = (document.hasStorageAccess ? "hasStorageAccess()" : "n/a");
		} catch {
		}
		try {
			const el = window.frameElement;
			console.warn("Frame element:", {
				id: el?.id || null,
				width: el?.clientWidth,
				height: el?.clientHeight,
				sandbox: el?.getAttribute?.("sandbox"),
				allow: el?.getAttribute?.("allow"),
				referrerpolicy: el?.getAttribute?.("referrerpolicy"),
				sameOriginParent,
				storageAccess
			});
		} catch (e) {
			console.error("FrameElement not accessible (cross-origin)", e);
		}
	}
}

export const navigationTimingLog = () => {
	console.error("Navigation timing");
	const nav = performance.getEntriesByType?.("navigation")?.[0];
	console.warn("Navigation timing:", nav ? (nav.toJSON?.() || nav) : "n/a");
}

export const globalErrorListener = () => {
	window.addEventListener("error", (e) => {
		console.error("Global Error:", e.message, e.filename, e.lineno, e.colno, e.error);
	});
	window.addEventListener("unhandledrejection", (e) => {
		console.error("Unhandled Promise rejection:", e.reason);
	});
}

export const indexedDBAsyncCheckLog = () => {
	console.error("IndexedDB async check");

	// Basic support check
	if (!('indexedDB' in window)) {
		console.warn("IndexedDB: not supported in this environment");
		return;
	}

	const t0 = performance.now();
	const order: string[] = ["start"];
	const dbName = `logger-idb-test-${Math.random().toString(36).slice(2)}`;

	try {
		const req = indexedDB.open(dbName, 1);

		order.push("after open() return");

		// Mark micro/macro task boundaries to visualize async behavior
		Promise.resolve().then(() => order.push("microtask (Promise.then)"));
		setTimeout(() => order.push("macrotask (setTimeout 0)"), 0);

		req.onupgradeneeded = () => {
			order.push("onupgradeneeded");
		};

		req.onerror = () => {
			console.error("IndexedDB open error:", req.error);
			console.warn("IndexedDB event order (error path):", order);
		};

		req.onsuccess = () => {
			order.push("onsuccess");
			const delayMs = Math.round(performance.now() - t0);

			// Summary logs
			console.warn("IndexedDB event order:", order);
			console.warn("IndexedDB open async delay (ms):", delayMs);
			console.warn("IndexedDB fires synchronously:", false); // By spec, it's async.

			// Cleanup
			try {
				req.result.close();
				indexedDB.deleteDatabase(dbName);
			} catch {
			}
		};
	} catch (e) {
		// If anything throws synchronously, log it
		console.error("IndexedDB open threw synchronously:", e);
	}
};
