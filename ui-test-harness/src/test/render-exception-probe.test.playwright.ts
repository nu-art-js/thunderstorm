/*
 * @nu-art/ui-test-harness - EMPIRICAL PROBE spec (not a self-test of engine behavior).
 * Drives the render-exception scenarios and dumps, per scenario, exactly what the DevTools-hook
 * commit channel + the error channels observe. Writes a JSON artifact the investigator turns into
 * the findings doc. Touches NO engine source; asserts only that data was captured.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 */

import {expect, test} from '@playwright/test';
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import {mkdirSync, writeFileSync} from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const iifePath = resolve(__dirname, '../../dist-iife/harness.iife.js');
const probePagePath = '/src/test/render-exception.html';
const outDir = resolve(__dirname, '../../test-results');
const outFile = resolve(outDir, 'render-exception-data.json');

type FiberDump = {tag: number; name: string; stateNode: string};
type CommitDump = {index: number; fibers: FiberDump[]; boundary?: {hasErrorInMemoizedState: boolean; instanceErrorMessage: string | null}};
type ExcData = {
	commits: CommitDump[];
	consoleErrors: string[];
	windowErrors: string[];
	syncThrows: string[];
	didCatch: {message: string; componentStack: boolean}[];
};

declare global {
	interface Window {
		__exc: {
			reset: () => void;
			getData: () => ExcData;
			s1: () => void; s2: () => void; s3a: () => void; s3b: () => void;
			s4: () => void; s4Update: () => void; s5a: () => void; s5b: () => void;
		};
	}
}

type ScenarioResult = ExcData & {
	scenario: string;
	description: string;
	hookFiredCount: number;
	pageErrors: string[];
	consoleErrorsTest: string[];
};

test('render-exception probe — capture per-scenario fiber + error observations', async ({page}) => {
	await page.addInitScript({path: iifePath});

	// Test-side error channels (cross-validate the in-page capture).
	const pageErrors: string[] = [];
	const consoleErrorsTest: string[] = [];
	page.on('pageerror', err => pageErrors.push(err.message));
	page.on('console', msg => {
		if (msg.type() === 'error')
			consoleErrorsTest.push(msg.text().slice(0, 240));
	});

	await page.goto(probePagePath);
	await page.waitForFunction(() => window.__exc !== undefined);

	const results: ScenarioResult[] = [];

	const runScenario = async (
		scenario: string,
		description: string,
		drive: () => Promise<void>,
	): Promise<void> => {
		const errBase = pageErrors.length;
		const conBase = consoleErrorsTest.length;
		await page.evaluate(() => window.__exc.reset());

		await drive();

		// Let React flush commits, error replays, and the engine rAF audit settle.
		await page.waitForTimeout(250);

		const data = await page.evaluate(() => window.__exc.getData());
		results.push({
			scenario,
			description,
			...data,
			hookFiredCount: data.commits.length,
			pageErrors: pageErrors.slice(errBase),
			consoleErrorsTest: consoleErrorsTest.slice(conBase),
		});
	};

	await runScenario('1', 'Class throws in render() — NO boundary',
		() => page.evaluate(() => window.__exc.s1()));

	await runScenario('2', 'Class throws in render() — WITH boundary',
		() => page.evaluate(() => window.__exc.s2()));

	await runScenario('3a', 'Class throws in componentDidMount() — NO boundary',
		() => page.evaluate(() => window.__exc.s3a()));

	await runScenario('3b', 'Class throws in componentDidMount() — WITH boundary',
		() => page.evaluate(() => window.__exc.s3b()));

	await runScenario('4', 'Class throws in componentDidUpdate() — WITH boundary (mount phase0, then update phase1)',
		async () => {
			await page.evaluate(() => window.__exc.s4());
			await page.waitForTimeout(120);
			await page.evaluate(() => window.__exc.s4Update());
		});

	await runScenario('5a', 'Function throws in render() — NO boundary',
		() => page.evaluate(() => window.__exc.s5a()));

	await runScenario('5b', 'Function throws in render() — WITH boundary',
		() => page.evaluate(() => window.__exc.s5b()));

	mkdirSync(outDir, {recursive: true});
	writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');

	// Sanity: every scenario produced an observation record; at least one commit somewhere.
	expect(results).toHaveLength(7);
	expect(results.some(r => r.hookFiredCount > 0)).toBe(true);
});
