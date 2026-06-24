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
	extends React.Component<{label: string}, {isLoading: boolean}> {

	state = {isLoading: false};

	render() {
		return <div data-testid="stateful">{this.props.label}</div>;
	}
}

/** Class component reporting state.isLoading === true → the audit must skip it entirely. */
class LoadingProbe
	extends React.Component<{label: string}, {isLoading: boolean}> {

	state = {isLoading: true};

	render() {
		return <div data-testid="loading">{this.props.label}</div>;
	}
}

/** Function component → fiber tag 0 → props from memoizedProps, state undefined. */
function StatelessProbe(props: {label: string}) {
	return <span data-testid="stateless">{props.label}</span>;
}

/** Function component whose only host node is deliberately collapsed (zero height) → trips Tier-1. */
function CollapsedProbe() {
	return (
		<div data-testid="collapsed" style={{height: 0, overflow: 'hidden'}}>
			<span>structurally-collapsed content</span>
		</div>
	);
}

/** Host node with display:none → Tier-1 not-visible invariant. */
function HiddenDisplayProbe() {
	return <div data-testid="hidden-display" style={{display: 'none'}}>hidden</div>;
}

/** Host node with visibility:hidden → Tier-1 not-visible invariant. */
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

function App() {
	return (
		<>
			<StatefulProbe label="stateful"/>
			<LoadingProbe label="loading"/>
			<StatelessProbe label="stateless"/>
			<CollapsedProbe/>
			<HiddenDisplayProbe/>
			<HiddenVisibilityProbe/>
			<FragmentProbe/>
			<SvgProbe/>
			<PortalProbe/>
		</>
	);
}

declare global {
	interface Window {
		__harnessTest: {mount: () => void};
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
};
