/*
 * @nu-art/ui-test-harness - Playwright self-test: proves fail-fast contract + exception halt end-to-end
 * against the REAL injected IIFE artifact, with zero Beamz dependency.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect, test} from '@playwright/test';
import type {ExtractedComponent, UI_Assertion, UI_AssertionFailure, UI_AssertionOptions, UI_AssertionTrace} from '@nu-art/ui-test-harness';
import {resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const iifePath = resolve(__dirname, '../../dist-iife/harness.iife.js');
const testPagePath = '/src/test/index.html';

declare global {
	interface Window {
		__uiTestHarness: {
			registerAssertion: (name: string, assertion: UI_Assertion, options?: UI_AssertionOptions) => void;
			registerExpectedException: (rule: {component: string; messageSubstring: string}) => void;
			getFirstFailure: () => UI_AssertionFailure | null;
			drainTrace: () => UI_AssertionTrace[];
			getTrace: () => readonly UI_AssertionTrace[];
		};
		__harnessTest: {
			mount: () => void;
			mountLazy: () => void;
			resolveLazy: () => void;
			mountException: () => void;
			mountExceptionWithBoundary: () => void;
			mountExpectedException: () => void;
		};
		__preCommitCalled?: boolean;
	}
}

/** Wait until the rAF-debounced run finished (run-complete in trace). */
const waitForRunComplete = (page: import('@playwright/test').Page) =>
	page.waitForFunction(() =>
		window.__uiTestHarness.getTrace().some(e => e.action === 'run-complete'),
	);

/** Wait until the engine recorded its first halt failure. */
const waitForHalt = (page: import('@playwright/test').Page) =>
	page.waitForFunction(() => window.__uiTestHarness.getFirstFailure() !== null);

test.describe('ui-test-harness — fail-fast audit self-test', () => {
	test.beforeEach(async ({page}) => {
		await page.addInitScript({path: iifePath});
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.__uiTestHarness !== undefined);
		await page.waitForFunction(() => window.__harnessTest !== undefined);
	});

	test('contract failure halts on first and reports component, state, and detail', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('StatefulProbe', t => {
				if (t.state?.tick !== 0)
					return `expected tick 0, got ${JSON.stringify(t.state?.tick)}`;
				return 'intentional-contract-violation';
			});
			window.__harnessTest.mount();
		});

		await waitForHalt(page);
		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());

		expect(failure).toEqual({
			name: 'StatefulProbe',
			state: {tick: 0},
			kind: 'assertion',
			detail: 'intentional-contract-violation',
		});
	});

	test('passing contract yields no failure', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('StatelessProbe', () => undefined);
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('extracts class props from instance and function props from memoizedProps', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerAssertion('StatefulProbe', t => {
				if (t.props?.label !== 'stateful')
					return `class props.label expected "stateful", got ${JSON.stringify(t.props?.label)}`;
				return undefined;
			});
			harness.registerAssertion('StatelessProbe', t => {
				if (t.props?.label !== 'stateless')
					return `fn props.label expected "stateless", got ${JSON.stringify(t.props?.label)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('class named state reaches the contract', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('StatefulProbe', t => {
				if (t.state?.tick !== 0)
					return `class state.tick expected 0, got ${JSON.stringify(t.state?.tick)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('hookKeys produce named state; positional hooks fallback without keys', async ({page}) => {
		await page.evaluate(() => {
			const harness = window.__uiTestHarness;
			harness.registerAssertion('HookKeysProbe', t => {
				if (t.state?.loading !== false)
					return `state.loading expected false, got ${JSON.stringify(t.state?.loading)}`;
				if (t.state?.count !== 3)
					return `state.count expected 3, got ${JSON.stringify(t.state?.count)}`;
				return undefined;
			}, {hookKeys: ['loading', 'count']});
			harness.registerAssertion('HookStateProbe', t => {
				if (t.state !== undefined)
					return `state expected undefined without hookKeys, got ${JSON.stringify(t.state)}`;
				if (t.hooks?.[0] !== 7)
					return `hooks[0] expected 7, got ${JSON.stringify(t.hooks?.[0])}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('drift guard fires when hook count differs from declared hookKeys', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('HookDriftProbe', () => undefined, {hookKeys: ['a', 'b']});
			window.__harnessTest.mount();
		});

		await waitForHalt(page);
		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());

		expect(failure?.kind).toBe('hook-drift');
		expect(failure?.name).toBe('HookDriftProbe');
		expect(failure?.detail).toContain('hooks changed for HookDriftProbe');
		expect(failure?.detail).toContain('update its key map');
	});

	test('state-aware contract accepts zero-box when collapsed state is true', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('StateAwareLayoutProbe', t => {
				if (t.state?.collapsed !== true)
					return `expected collapsed=true, got ${JSON.stringify(t.state?.collapsed)}`;
				const rect = t.node?.getBoundingClientRect();
				if (rect && rect.height === 0)
					return undefined;
				return 'expected zero-height when collapsed';
			}, {hookKeys: ['collapsed']});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
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
			harness.registerAssertion('MemoProbe', t => {
				if (t.props?.label !== 'memo')
					return `memo props.label expected "memo", got ${JSON.stringify(t.props?.label)}`;
				return expectTestId('memo')(t);
			});
			harness.registerAssertion('ForwardRefProbe', t => {
				if (t.props?.label !== 'forward')
					return `forwardRef props.label expected "forward", got ${JSON.stringify(t.props?.label)}`;
				return expectTestId('forward-ref')(t);
			});
			harness.registerAssertion('MemoHookProbe', t => {
				if (t.hooks?.[0] !== true)
					return `memo hooks[0] expected true, got ${JSON.stringify(t.hooks?.[0])}`;
				return expectTestId('memo-hook')(t);
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
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
			harness.registerAssertion('StatefulProbe', expectTestId('stateful'));
			harness.registerAssertion('StatelessProbe', expectTestId('stateless'));
			harness.registerAssertion('FragmentProbe', expectTestId('fragment-inner'));
			harness.registerAssertion('SvgProbe', expectTestId('svg-root'));
			harness.registerAssertion('PortalProbe', expectTestId('portal-target'));
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('unregistered hidden/collapsed components produce no layout failure', async ({page}) => {
		await page.evaluate(() => window.__harnessTest.mount());

		await waitForRunComplete(page);
		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());
		expect(failure).toBeNull();

		const trace = await page.evaluate(() => window.__uiTestHarness.drainTrace());
		expect(trace.some(e => e.action === 'tier1' as string)).toBe(false);
	});

	test('collects every owned host root for multi-host fragments', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('MultiHostFragmentProbe', t => {
				const testIds = t.nodes.map(n => n.getAttribute('data-testid'));
				if (testIds.length !== 2)
					return `nodes.length expected 2, got ${testIds.length}`;
				if (testIds[0] !== 'multi-a' || testIds[1] !== 'multi-b')
					return `nodes testids expected ["multi-a","multi-b"], got ${JSON.stringify(testIds)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('does not assign a contracted child component host to parent nodes', async ({page}) => {
		await page.evaluate(() => {
			// ChildHostProbe carries its own contract → it is a real ownership boundary, so the
			// contract-aware walk must stop there and NOT bubble its host up to the parent.
			window.__uiTestHarness.registerAssertion('ChildHostProbe', () => undefined);
			window.__uiTestHarness.registerAssertion('ParentChildBoundaryProbe', t => {
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

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('attributes a host rendered through a contract-less wrapper to the enclosing contracted owner', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('OwnerProbe', t => {
				if (!t.node)
					return 'OwnerProbe: expected to own a host through the contract-less PlainWrapper, got none';
				if (!t.node.classList.contains('plain-wrapper'))
					return `OwnerProbe: owned root expected .plain-wrapper, got ${JSON.stringify(t.node.className)}`;
				if (!t.node.querySelector('[data-testid="owner-host"]'))
					return 'OwnerProbe: owned host must contain the owner-host element';
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('fail-fast still halts on a real contract failure for the nested-through-wrapper case', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('OwnerProbe', t => {
				if (!t.node?.querySelector('[data-testid="owner-host"]'))
					return 'OwnerProbe: precondition — owned host with owner-host must be visible through the wrapper';
				return 'intentional-wrapper-owner-violation';
			});
			window.__harnessTest.mount();
		});

		await waitForHalt(page);
		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());

		expect(failure?.kind).toBe('assertion');
		expect(failure?.name).toBe('OwnerProbe');
		expect(failure?.detail).toBe('intentional-wrapper-owner-violation');
	});

	test('audits lazy-loaded inner components after Suspense resolves', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerAssertion('LazyInnerProbe', t => {
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
				e.name === 'LazyInnerProbe' && e.action === 'assertion' && e.outcome === 'pass',
			),
		);

		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});

	test('render exception without boundary halts with component name', async ({page}) => {
		await page.evaluate(() => window.__harnessTest.mountException());
		await waitForHalt(page);

		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());
		expect(failure?.kind).toBe('exception');
		expect(failure?.name).toBe('ThrowNoBoundaryProbe');
		expect(failure?.detail).toMatch(/probe-render-boom|ThrowNoBoundaryProbe/);
	});

	test('render exception caught by boundary still halts with component name', async ({page}) => {
		await page.evaluate(() => window.__harnessTest.mountExceptionWithBoundary());
		await waitForHalt(page);

		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());
		expect(failure?.kind).toBe('exception');
		expect(failure?.name).toBe('ThrowNoBoundaryProbe');
	});

	test('allowlisted expected exception does not halt', async ({page}) => {
		await page.evaluate(() => {
			window.__uiTestHarness.registerExpectedException({
				component: 'ThrowExpectedProbe',
				messageSubstring: 'expected-probe-boom',
			});
			window.__harnessTest.mountExpectedException();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
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
			window.__uiTestHarness.registerAssertion('StatefulProbe', () => 'chain-smoke-contract');
			window.__harnessTest.mount();
		});

		await page.waitForFunction(() => window.__preCommitCalled === true);
		await waitForHalt(page);

		const failure = await page.evaluate(() => window.__uiTestHarness.getFirstFailure());
		expect(failure?.name).toBe('StatefulProbe');
		expect(failure?.kind).toBe('assertion');
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
			window.__uiTestHarness.registerAssertion('StatelessProbe', t => {
				if (t.props?.label !== 'stateless')
					return `props broken after double inject: ${JSON.stringify(t.props)}`;
				return undefined;
			});
			window.__harnessTest.mount();
		});

		await waitForRunComplete(page);
		expect(await page.evaluate(() => window.__uiTestHarness.getFirstFailure())).toBeNull();
	});
});
