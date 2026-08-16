/*
 * @nu-art/e2e-harness - Abstract programmatic bootstrap for product E2E stacks
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export const DEFAULT_READY_TIMEOUT_MS = 120_000;
export const DEFAULT_POLL_INTERVAL_MS = 500;

/** Probe whether a health URL responds to GET. Injectable for unit tests. */
export type HealthProbe = (url: string) => Promise<boolean>;

export function createFetchHealthProbe(options?: {relaxTls?: boolean}): HealthProbe {
	const relaxTls = options?.relaxTls ?? true;
	return async (url: string) => {
		if (relaxTls)
			process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= '0';
		const response = await fetch(url, {method: 'GET'}).catch(() => undefined);
		return !!response;
	};
}

export async function waitForHealthUrl(
	url: string,
	probe: HealthProbe,
	timeoutMs: number = DEFAULT_READY_TIMEOUT_MS,
	pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await probe(url))
			return;
		await sleep(pollIntervalMs);
	}
	throw new Error(
		`E2E harness: health URL did not become reachable at ${url} within ${timeoutMs}ms.`,
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
