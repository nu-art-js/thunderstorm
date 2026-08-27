/*
 * @nu-art/ui-test-harness - Self-test page: a throwaway React app mounting probe components so the
 * harness has a real fiber tree to audit. Deliberately NOT auto-mounted — the test registers
 * contracts first, then calls window.__harnessTest.mount() to trigger the commit.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import React from 'react';
import {createPortal} from 'react-dom';
import {createRoot, Root} from 'react-dom/client';

/** Class component → fiber tag 1 → props AND state extracted from the live instance. */
class StatefulProbe
	extends React.Component<{label: string}, {tick: number}> {

	state = {tick: 0};

	render() {
		return <div data-testid="stateful">{this.props.label}</div>;
	}
}

/** Function component → fiber tag 0 → props from memoizedProps, no hooks. */
function StatelessProbe(props: {label: string}) {
	return <span data-testid="stateless">{props.label}</span>;
}

/** Function component with useState → hook values exposed via `ExtractedComponent.hooks`. */
function HookStateProbe() {
	const [tick] = React.useState(7);
	return <div data-testid="hook-state">{tick}</div>;
}

/** Named hook state via declared hookKeys at registration. */
function HookKeysProbe() {
	const [loading] = React.useState(false);
	const [count] = React.useState(3);
	return <div data-testid="hook-keys">{loading ? 'loading' : count}</div>;
}

/** Deliberately three hooks — registration will declare two to trigger drift guard. */
function HookDriftProbe() {
	const [a] = React.useState(1);
	const [b] = React.useState(2);
	const [c] = React.useState(3);
	return <div data-testid="hook-drift">{a + b + c}</div>;
}

/** State-aware contract probe — zero-box is valid when collapsed=true. */
function StateAwareLayoutProbe() {
	const [collapsed] = React.useState(true);
	if (collapsed)
		return <div data-testid="state-aware" style={{height: 0, overflow: 'hidden'}}>collapsed</div>;

	return <div data-testid="state-aware">expanded</div>;
}

const MemoProbe = React.memo(function MemoProbe(props: {label: string}) {
	return <div data-testid="memo">{props.label}</div>;
});

const MemoHookProbe = React.memo(function MemoHookProbe() {
	const [ready] = React.useState(true);
	return <div data-testid="memo-hook">{ready ? 'ready' : 'pending'}</div>;
});

const ForwardRefProbe = React.forwardRef<HTMLDivElement, {label: string}>(
	function ForwardRefProbe(props, ref) {
		return <div ref={ref} data-testid="forward-ref">{props.label}</div>;
	},
);

/** Host node with display:none — valid when a contract does not claim layout for this component. */
function HiddenDisplayProbe() {
	return <div data-testid="hidden-display" style={{display: 'none'}}>hidden</div>;
}

/** Host node with visibility:hidden — no generic Tier-1; unregistered components make no layout claim. */
function HiddenVisibilityProbe() {
	return <div data-testid="hidden-visibility" style={{visibility: 'hidden'}}>hidden</div>;
}

/** Fragment wrapper → domNodeOf must descend to the first host child. */
function FragmentProbe() {
	return (
		<>
			<div data-testid="fragment-inner">fragment content</div>
		</>
	);
}

/** Multi-host fragment → ownedHostNodesOf collects every root without nesting into child components. */
function MultiHostFragmentProbe() {
	return (
		<>
			<div data-testid="multi-a">visible</div>
			<div data-testid="multi-b" style={{display: 'none'}}>hidden</div>
		</>
	);
}

/** Child host appears before parent-owned host — parent must not claim the child's node. */
function ChildHostProbe() {
	return <div data-testid="child-owned-host">child</div>;
}

function ParentChildBoundaryProbe() {
	return (
		<>
			<ChildHostProbe/>
			<div data-testid="parent-owned-host">parent</div>
		</>
	);
}

/**
 * Contract-LESS wrapper that renders a host div around its children — mimics a generic framework
 * layout primitive (e.g. `LL_H_C`). It has no registered contract, so the ownership boundary must
 * see through it: any host it renders belongs to the nearest enclosing component that HAS a contract.
 */
function PlainWrapper(props: {children: React.ReactNode}) {
	return <div className="plain-wrapper">{props.children}</div>;
}

/**
 * Component WITH a registered contract whose root is delegated through the contract-less
 * `PlainWrapper`. Proves transparency: `OwnerProbe` must own the `plain-wrapper` host (and the
 * `owner-host` element nested inside it), NOT lose it to the intermediate primitive.
 */
function OwnerProbe() {
	return (
		<PlainWrapper>
			<div data-testid="owner-host">owned through wrapper</div>
		</PlainWrapper>
	);
}

function LazyInnerProbe() {
	return <div data-testid="lazy-inner">loaded</div>;
}

LazyInnerProbe.displayName = 'LazyInnerProbe';

let resolveLazyInner: ((value: {default: React.ComponentType}) => void) | undefined;
const lazyInnerLoadPromise = new Promise<{default: React.ComponentType}>(resolve => {
	resolveLazyInner = resolve;
});

const LazyInnerModule = React.lazy(() => lazyInnerLoadPromise);

function LazySuspenseProbe() {
	return (
		<React.Suspense fallback={<div data-testid="lazy-fallback">loading</div>}>
			<LazyInnerModule/>
		</React.Suspense>
	);
}

/** SVG host root → domNodeOf must return an Element (not limited to HTMLElement). */
function SvgProbe() {
	return (
		<svg data-testid="svg-root" width="10" height="10">
			<circle cx="5" cy="5" r="4"/>
		</svg>
	);
}

/** Portal → domNodeOf must resolve via stateNode.containerInfo. */
function PortalProbe() {
	const [portalContainer] = React.useState(() => {
		const el = document.createElement('div');
		el.setAttribute('data-testid', 'portal-target');
		document.body.appendChild(el);
		return el;
	});

	return createPortal(<span>portal content</span>, portalContainer);
}

class ThrowNoBoundaryProbe
	extends React.Component {

	render(): React.ReactNode {
		throw new Error('probe-render-boom');
	}
}

class ErrBoundary
	extends React.Component<{children: React.ReactNode}, {error: {message: string} | null}> {

	state: {error: {message: string} | null} = {error: null};

	static getDerivedStateFromError(error: Error): {error: {message: string}} {
		return {error: {message: error.message}};
	}

	render(): React.ReactNode {
		if (this.state.error)
			return <div data-testid="boundary-fallback">fallback</div>;
		return this.props.children;
	}
}

function ThrowExpectedProbe(): React.ReactNode {
	throw new Error('expected-probe-boom');
}

function App() {
	return (
		<>
			<StatefulProbe label="stateful"/>
			<StatelessProbe label="stateless"/>
			<HookStateProbe/>
			<HookKeysProbe/>
			<HookDriftProbe/>
			<StateAwareLayoutProbe/>
			<MemoProbe label="memo"/>
			<MemoHookProbe/>
			<ForwardRefProbe label="forward"/>
			<HiddenDisplayProbe/>
			<HiddenVisibilityProbe/>
			<FragmentProbe/>
			<MultiHostFragmentProbe/>
			<ParentChildBoundaryProbe/>
			<OwnerProbe/>
			<SvgProbe/>
			<PortalProbe/>
		</>
	);
}

function LazySuspenseApp() {
	return (
		<div id="lazy-app">
			<LazySuspenseProbe/>
		</div>
	);
}

function ExceptionApp() {
	return (
		<div data-testid="exception-wrap">
			<ThrowNoBoundaryProbe/>
		</div>
	);
}

function ExceptionBoundaryApp() {
	return (
		<ErrBoundary>
			<ThrowNoBoundaryProbe/>
		</ErrBoundary>
	);
}

function ExpectedExceptionApp() {
	return (
		<ErrBoundary>
			<ThrowExpectedProbe/>
		</ErrBoundary>
	);
}

declare global {
	interface Window {
		__harnessTest: {
			mount: () => void;
			mountLazy: () => void;
			resolveLazy: () => void;
			mountException: () => void;
			mountExceptionWithBoundary: () => void;
			mountExpectedException: () => void;
		};
	}
}

let root: Root | null = null;

window.__harnessTest = {
	mount: () => {
		const container = document.getElementById('test-root');
		if (!container)
			throw new Error('test-root container missing');

		root ??= createRoot(container);
		root.render(<App/>);
	},
	mountLazy: () => {
		const container = document.getElementById('test-root');
		if (!container)
			throw new Error('test-root container missing');

		root ??= createRoot(container);
		root.render(<LazySuspenseApp/>);
	},
	resolveLazy: () => {
		if (!resolveLazyInner)
			throw new Error('lazy resolver not initialized');

		resolveLazyInner({default: LazyInnerProbe});
	},
	mountException: () => {
		const container = document.getElementById('test-root');
		if (!container)
			throw new Error('test-root container missing');

		root ??= createRoot(container);
		root.render(<ExceptionApp/>);
	},
	mountExceptionWithBoundary: () => {
		const container = document.getElementById('test-root');
		if (!container)
			throw new Error('test-root container missing');

		root ??= createRoot(container);
		root.render(<ExceptionBoundaryApp/>);
	},
	mountExpectedException: () => {
		const container = document.getElementById('test-root');
		if (!container)
			throw new Error('test-root container missing');

		root ??= createRoot(container);
		root.render(<ExpectedExceptionApp/>);
	},
};
