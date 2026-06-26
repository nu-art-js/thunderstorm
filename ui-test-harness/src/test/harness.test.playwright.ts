/*
 * @nu-art/ui-test-harness - Playwright self-test: proves the trigger -> extract -> assert -> drain
 * loop end-to-end against the REAL injected IIFE artifact, with zero Beamz dependency.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import type {AuditFailure, AuditTraceEntry, Contract, ExtractedComponent} from '@nu-art/ui-test-harness';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const iifePath = resolve(__dirname, '../../dist-iife/harness.iife.js');
const testPagePath = '/src/test/index.html';

declare global {
	interface Window {
		__uiTestHarness: {
			registerContract: (name: string, contract: Contract) => void;
			drain: () => AuditFailure[];
			peek: () => AuditFailure[];
			drainTrace: () => AuditTraceEntry[];
			getTrace: () => readonly AuditTraceEntry[];
		};
		__harnessTest: {mount: () => void; mountLazy: () => void; resolveLazy: () => void};
		__preCommitCalled?: boolean;
	}
}

/** Wait until Tier-1 has flagged the collapsed probe — proves the rAF audit finished. */
const waitForAudit = (page: import('@playwright/test').Page) =>
	page.waitForFunction(() => window.__uiTestHarness.peek().some(f => f.name === 'CollapsedProbe'));

test.describe('ui-test-harness — fiber audit self-test', () => {
	// Inject the real shippable bundle BEFORE any page script, so the DevTools hook is in place
	// before the page's React initializes.
	test.beforeEach(async ({page}) => {
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);
		await page.waitForFunction(() => window.__harnessTest !== undefined);
	});

	test('drains exactly the seeded contract failure and the collapsed-node Tier-1 failure', async ({page}) => {
		// One intentionally-failing contract, one passing contract — then trigger the render (commit).
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('StatefulProbe', () => 'intentional-contract-violation');
			harness.registerContract('StatelessProbe', () => undefined);
			window.__harnessTest.mount();
		});

		// Deterministic: wait until the rAF-debounced audit has actually produced output.
		await waitForAudit(page);
		const failures = await page.evaluate(() => window.__uiTestHarness.drain());

		const contractFailures = failures.filter(f => f.kind === 'contract');
		const tier1Failures = failures.filter(f => f.kind === 'tier1');

		// Exactly the seeded contract failure — the passing contract contributes nothing.
		expect(contractFailures).toEqual([
			{name: 'StatefulProbe', kind: 'contract', detail: 'intentional-contract-violation'}
		]);

		// Tier-1 flags layout/visibility probes; collapsed is the anchor assertion.
		expect(tier1Failures.map(f => f.name)).toContain('CollapsedProbe');
		expect(tier1Failures.map(f => f.name)).toEqual(expect.arrayContaining([
			'CollapsedProbe',
			'HiddenDisplayProbe',
			'HiddenVisibilityProbe',
		]));
		expect(tier1Failures.find(f => f.name === 'CollapsedProbe')?.detail).toContain('collapsed');
		expect(tier1Failures.find(f => f.name === 'CollapsedProbe')?.detail).toContain('data-testid="collapsed"');

		const trace = await page.evaluate(() => window.__uiTestHarness.drainTrace());
		expect(trace.some(e => e.action === 'audit-start')).toBe(true);
		expect(trace.some(e => e.action === 'audit-complete')).toBe(true);
		expect(trace.filter(e => e.action === 'contract' && e.name === 'StatefulProbe' && e.outcome === 'fail')).toHaveLength(1);
		expect(trace.filter(e => e.action === 'contract' && e.name === 'StatelessProbe' && e.outcome === 'pass')).toHaveLength(1);
		expect(trace.filter(e => e.action === 'tier1' && e.name === 'CollapsedProbe' && e.outcome === 'fail')).toHaveLength(1);
	});

	test('extracts class props from instance and function props from memoizedProps', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('StatefulProbe', t => {
				if (t.props?.label !== 'stateful')
					return `class props.label expected "stateful", got ${JSON.stringify(t.props?.label)}`;
				return undefined;
			});
			harness.registerContract('StatelessProbe', t => {
				if (t.props?.label !== 'stateless')
					return `fn props.label expected "stateless", got ${JSON.stringify(t.props?.label)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('extracts state for class components and undefined for function components', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('StatefulProbe', t => {
				if (t.state?.tick !== 0)
					return `class state.tick expected 0, got ${JSON.stringify(t.state?.tick)}`;
				return undefined;
			});
			harness.registerContract('StatelessProbe', t => {
				if (t.state !== undefined)
					return `function state expected undefined, got ${JSON.stringify(t.state)}`;
				if (t.hooks !== undefined)
					return `function hooks expected undefined, got ${JSON.stringify(t.hooks)}`;
				return undefined;
			});
			harness.registerContract('HookStateProbe', t => {
				if (t.hooks?.[0] !== 7)
					return `hooks[0] expected 7, got ${JSON.stringify(t.hooks?.[0])}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('audits memo and forwardRef wrappers under inner component names', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			const expectTestId = (expected: string) => (t: ExtractedComponent) => {
				const testId = t.node?.getAttribute('data-testid');
				if (testId !== expected)
					return `node data-testid expected "${expected}", got "${testId ?? 'null'}"`;
				return undefined;
			};
			harness.registerContract('MemoProbe', t => {
				if (t.props?.label !== 'memo')
					return `memo props.label expected "memo", got ${JSON.stringify(t.props?.label)}`;
				return expectTestId('memo')(t);
			});
			harness.registerContract('ForwardRefProbe', t => {
				if (t.props?.label !== 'forward')
					return `forwardRef props.label expected "forward", got ${JSON.stringify(t.props?.label)}`;
				return expectTestId('forward-ref')(t);
			});
			harness.registerContract('MemoHookProbe', t => {
				if (t.hooks?.[0] !== true)
					return `memo hooks[0] expected true, got ${JSON.stringify(t.hooks?.[0])}`;
				return expectTestId('memo-hook')(t);
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('resolves domNodeOf to the correct host element per probe shape', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			const expectTestId = (expected: string) => (t: ExtractedComponent) => {
				const testId = t.node?.getAttribute('data-testid');
				if (testId !== expected)
					return `node data-testid expected "${expected}", got "${testId ?? 'null'}"`;
				return undefined;
			};
			harness.registerContract('StatefulProbe', expectTestId('stateful'));
			harness.registerContract('StatelessProbe', expectTestId('stateless'));
			harness.registerContract('FragmentProbe', expectTestId('fragment-inner'));
			harness.registerContract('SvgProbe', expectTestId('svg-root'));
			harness.registerContract('PortalProbe', expectTestId('portal-target'));
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract');

		expect(contractFailures).toEqual([]);
	});

	test('Tier-1 flags display:none and visibility:hidden host nodes', async ({page}) => {
		await page.evaluate(() => window.__harnessTest.mount());

		await waitForAudit(page);
		const tier1Failures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'tier1');

		const displayFailure = tier1Failures.find(f => f.name === 'HiddenDisplayProbe');
		const visibilityFailure = tier1Failures.find(f => f.name === 'HiddenVisibilityProbe');

		expect(displayFailure?.detail).toBe('node[0] data-testid="hidden-display": not-visible: display=none');
		expect(visibilityFailure?.detail).toBe('node[0] data-testid="hidden-visibility": not-visible: visibility=hidden');
	});

	test('collects every owned host root for multi-host fragments', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('MultiHostFragmentProbe', t => {
				const testIds = t.nodes.map(n => n.getAttribute('data-testid'));
				if (testIds.length !== 2)
					return `nodes.length expected 2, got ${testIds.length}`;
				if (testIds[0] !== 'multi-a' || testIds[1] !== 'multi-b')
					return `nodes testids expected ["multi-a","multi-b"], got ${JSON.stringify(testIds)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const failures = await page.evaluate(() => window.__uiTestHarness.drain());
		const contractFailures = failures.filter(f => f.kind === 'contract');
		const multiHostTier1 = failures.filter(f => f.kind === 'tier1' && f.name === 'MultiHostFragmentProbe');

		expect(contractFailures).toEqual([]);
		const displayNoneFailure = multiHostTier1.find(f => f.detail.includes('display=none'));
		expect(displayNoneFailure).toBeDefined();
		expect(displayNoneFailure?.detail).toContain('node[1] data-testid="multi-b"');
	});

	test('does not assign child component hosts to parent nodes', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('ParentChildBoundaryProbe', t => {
				const testIds = t.nodes.map(n => n.getAttribute('data-testid'));
				if (testIds.length !== 1)
					return `parent nodes.length expected 1, got ${testIds.length}: ${JSON.stringify(testIds)}`;
				if (testIds[0] !== 'parent-owned-host')
					return `parent node expected parent-owned-host, got ${JSON.stringify(testIds[0])}`;
				if (testIds.includes('child-owned-host'))
					return 'parent nodes must not include child-owned-host';
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract' && f.name === 'ParentChildBoundaryProbe');

		expect(contractFailures).toEqual([]);
	});

	test('audits lazy-loaded inner components after Suspense resolves', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerContract('LazyInnerProbe', t => {
				const testId = t.node?.getAttribute('data-testid');
				if (testId !== 'lazy-inner')
					return `lazy inner node expected lazy-inner, got "${testId ?? 'null'}"`;
				return undefined;
			});
			window.__harnessTest.mountLazy();
		});

		await page.waitForFunction(() => document.querySelector('[data-testid="lazy-fallback"]') !== null);
		await page.evaluate(() => window.__harnessTest.resolveLazy());
		await page.waitForFunction(() => document.querySelector('[data-testid="lazy-inner"]') !== null);
		await page.waitForFunction(() =>
			window.__uiTestHarness.getTrace().some(e =>
				e.name === 'LazyInnerProbe' && e.action === 'contract' && e.outcome === 'pass',
			),
		);

		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract' && f.name === 'LazyInnerProbe');

		expect(contractFailures).toEqual([]);
	});

	test('verifies Suspense and Lazy fiber tags against react@18.3.1 WorkTags', async ({page}) => {
		await page.evaluate(() => window.__harnessTest.mountLazy());
		await page.waitForFunction(() => document.querySelector('[data-testid="lazy-fallback"]') !== null);

		const tags = await page.evaluate(() => {
			const host = document.getElementById('lazy-app');
			if (!host)
				throw new Error('lazy-app missing');

			const fiberKey = Object.keys(host).find(key => key.startsWith('__reactFiber$'));
			if (!fiberKey)
				throw new Error('react fiber key missing on lazy-app');

			type FiberNode = {
				tag: number;
				child: FiberNode | null;
				sibling: FiberNode | null;
				return: FiberNode | null;
			};

			let rootFiber = (host as Record<string, FiberNode>)[fiberKey];
			while (rootFiber.return)
				rootFiber = rootFiber.return;

			const tagSet = new Set<number>();
			const walk = (fiber: FiberNode | null): void => {
				if (!fiber)
					return;

				tagSet.add(fiber.tag);
				walk(fiber.child);
				walk(fiber.sibling);
			};

			walk(rootFiber.child);
			return {
				suspense: tagSet.has(13) ? 13 : undefined,
				lazy: tagSet.has(16) ? 16 : undefined,
				all: [...tagSet].sort((a, b) => a - b),
			};
		});

		expect(tags.suspense).toBe(13);
		// React 18 commits the deferred lazy branch as Offscreen (22) while fallback is shown.
		expect(tags.all).toContain(22);
		// LazyComponent (16) is not in the committed fallback tree; verified from react-dom@18.3.1
		// getComponentNameFromFiber switch (case 16 -> "Lazy") and exercised by lazy pass-through audit.
		expect(tags.lazy).toBeUndefined();
	});
});

test.describe('ui-test-harness — DevTools hook install', () => {
	test('chains with a pre-existing onCommitFiberRoot handler', async ({page}) => {
		await page.addInitScript(() => {
			window.__preCommitCalled = false;
			window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
				renderers: new Map(),
				supportsFiber: true,
				inject: () => 42,
				onCommitFiberRoot: () => {
					window.__preCommitCalled = true;
				},
				onCommitFiberUnmount: () => {},
			};
		});
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);

		await page.evaluate(() => {
			window.__uiTestHarness.registerContract('StatefulProbe', () => 'chain-smoke-contract');
			window.__harnessTest.mount();
		});

		await page.waitForFunction(() => window.__preCommitCalled === true);
		await page.waitForFunction(() => window.__uiTestHarness.peek().some(f => f.name === 'StatefulProbe'));

		const failures = await page.evaluate(() => window.__uiTestHarness.drain());
		expect(failures.some(f => f.name === 'StatefulProbe' && f.kind === 'contract')).toBe(true);
	});

	test('double IIFE injection leaves hook wrap idempotent and audit functional', async ({page}) => {
		await page.addInitScript({path: iifePath});
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);

		const hookState = await page.evaluate(() => ({
			wrapped: window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.__uiTestHarnessWrapped === true,
		}));
		expect(hookState.wrapped).toBe(true);

		await page.evaluate(() => {
			window.__uiTestHarness.registerContract('StatelessProbe', t => {
				if (t.props?.label !== 'stateless')
					return `props broken after double inject: ${JSON.stringify(t.props)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForAudit(page);
		const contractFailures = (await page.evaluate(() => window.__uiTestHarness.drain()))
			.filter(f => f.kind === 'contract' && f.name === 'StatelessProbe');

		expect(contractFailures).toEqual([]);
	});
});
