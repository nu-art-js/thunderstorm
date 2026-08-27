/**
 * Reverse of "locate": given a clicked preview element, discover which design tokens
 * compose it by matching CSSOM rules and following var() chains.
 */
import {
	collectTokenRefsFromRules,
	parseColor,
	readDeclaredTokenNames,
	resolveTokenChain,
	resolvedTokenValue
} from './token-introspection.js';

export type TokenInspectBinding = {
	token: string;
	/** Upstream var() refs (component → semantic), transitive, excluding self. */
	chain: string[];
	/** CSS properties (or custom-property assignments) that referenced this token. */
	usedVia: string[];
};

export type ElementTokenInspectResult = {
	bindings: TokenInspectBinding[];
	/** Flat unique token list for editor row highlighting. */
	tokens: string[];
};

type TokenRecorder = (token: string, via: string) => void;

const selectorMatchesElement = (element: Element, selectorText: string): boolean => {
	for (const part of selectorText.split(',')) {
		const sel = part.trim();
		if (!sel)
			continue;
		try {
			if (element.matches(sel))
				return true;
		} catch {
			// Selector unsupported by element.matches — skip.
		}
	}
	return false;
};

/** Ancestor chain from clicked node up to (and including) the preview boundary. */
const ancestorChain = (element: Element, boundary: Element | null | undefined): Element[] => {
	const chain: Element[] = [];
	let node: Element | null = element;
	while (node) {
		chain.push(node);
		if (boundary && node === boundary)
			break;
		node = node.parentElement;
	}
	return chain;
};

const makeRecorder = (
	viaMap: Map<string, Set<string>>,
	allTokens: Set<string>
): TokenRecorder => (token, via) => {
	if (!viaMap.has(token))
		viaMap.set(token, new Set());
	viaMap.get(token)!.add(via);
	allTokens.add(token);
};

const colorsEqual = (a: string, b: string): boolean => {
	const ca = parseColor(a);
	const cb = parseColor(b);
	if (!ca || !cb)
		return false;
	return ca.r === cb.r && ca.g === cb.g && ca.b === cb.b && Math.abs(ca.a - cb.a) < 0.02;
};

/** Match computed paint values back to declared tokens (fallback when CSSOM omits a rule). */
const inferTokensFromComputedStyle = (
	element: Element,
	record: TokenRecorder,
	tokenFilter?: (token: string) => boolean
) => {
	const computed = getComputedStyle(element);
	const paintProps = ['background-color', 'color', 'border-color'] as const;

	for (const cssProp of paintProps) {
		const value = computed.getPropertyValue(cssProp).trim();
		if (!value || value === 'transparent')
			continue;
		const parsed = parseColor(value);
		if (parsed && parsed.a === 0)
			continue;

		for (const token of readDeclaredTokenNames()) {
			if (tokenFilter && !tokenFilter(token))
				continue;
			if (colorsEqual(value, resolvedTokenValue(token)))
				record(token, cssProp);
		}
	}
};

/** Tokens activated by DOM state when attribute/class selectors are missed by CSSOM matching. */
const applyDomStateTokens = (element: Element, record: TokenRecorder) => {
	const errorLevel = element.getAttribute('data-error-level');
	if (errorLevel !== 'error')
		return;

	if (element.classList.contains('ts-input'))
		record('--ts-input--error-border', 'border-color');
	if (element.classList.contains('ts-textarea'))
		record('--ts-textarea--error-border', 'border-color');
};

/**
 * Button variant skins assign bg/border on :enabled/:disabled/:hover rules. When the
 * CSSOM walk misses those (shorthand omission, cascade quirks), derive tokens from the
 * live DOM state on .ts-button — mirrors components/_button.scss.
 */
const applyButtonVariantTokens = (element: Element, record: TokenRecorder) => {
	if (!element.classList.contains('ts-button'))
		return;

	const variant = element.getAttribute('data-variant');
	if (!variant)
		return;

	const disabled = element.hasAttribute('disabled');
	const hover = element.classList.contains('pseudo-hover');

	switch (variant) {
		case 'primary':
			record(disabled ? '--ts-button--primary-disabled-text' : '--color-action-primary-text', '--ts-button--content-color');
			if (disabled) {
				record('--ts-button--primary-disabled-bg', 'background');
				record('--ts-button--primary-disabled-border', 'border-color');
			} else if (hover) {
				record('--ts-button--primary-bg-hover', 'background');
			} else {
				record('--ts-button--primary-bg', 'background');
			}
			break;

		case 'secondary':
			record(disabled ? '--ts-button--secondary-disabled-text' : '--color-text-primary', '--ts-button--content-color');
			if (disabled) {
				record('--ts-button--secondary-disabled-bg', 'background');
				record('--ts-button--secondary-disabled-border', 'border-color');
			} else if (hover) {
				record('--ts-button--secondary-bg-hover', 'background');
				record('--ts-button--secondary-border-hover', 'border-color');
			} else {
				record('--ts-button--secondary-bg', 'background');
				record('--ts-button--secondary-border', 'border-color');
			}
			break;

		case 'tertiary':
		case 'text':
			record(disabled ? '--ts-button--ghost-disabled-text' : '--ts-button--ghost-text', '--ts-button--content-color');
			if (disabled) {
				record('--ts-button--ghost-disabled-bg', 'background');
				record('--ts-button--ghost-disabled-border', 'border-color');
			} else if (hover) {
				record('--ts-button--ghost-bg-hover', 'background');
			}
			if (variant === 'tertiary' && !disabled)
				record('--ts-button--ghost-border', 'border-color');
			break;

		case 'dangerous':
			record(disabled ? '--ts-button--dangerous-disabled-text' : '--ts-button--dangerous-text', '--ts-button--content-color');
			if (disabled) {
				record('--ts-button--dangerous-disabled-bg', 'background');
				record('--ts-button--dangerous-disabled-border', 'border-color');
			} else if (hover) {
				record('--ts-button--dangerous-bg-hover', 'background');
			} else {
				record('--ts-button--dangerous-bg', 'background');
				record('--ts-button--dangerous-border', 'border-color');
			}
			break;
	}
};

const bindingPriority = (binding: TokenInspectBinding): number => {
	const vias = binding.usedVia.join(' ');
	if (vias.includes('background'))
		return 0;
	if (vias.includes('border-color') || vias.includes('border'))
		return 1;
	if (vias.includes('color'))
		return 2;
	return 3;
};

/**
 * Inspect a preview element: match stylesheet rules on it and its ancestors, collect
 * every var(--*) reference, and resolve chains through :root declarations and
 * matched-rule custom-property assignments (e.g. variant skins setting --ts-button--*).
 * Shares the CSSOM walk + chain resolver with token-introspection — the rule predicate
 * here is "any ancestor matches the rule's selector".
 */
export const inspectElementTokens = (
	element: Element,
	boundary?: Element | null
): ElementTokenInspectResult => {
	const ancestors = ancestorChain(element, boundary ?? null);
	const {viaMap, assignmentMap} = collectTokenRefsFromRules(
		selectorText => ancestors.some(ancestor => selectorMatchesElement(ancestor, selectorText))
	);

	const allTokens = new Set<string>();
	const record = makeRecorder(viaMap, allTokens);

	for (const target of ancestors) {
		applyDomStateTokens(target, record);
		applyButtonVariantTokens(target, record);
	}

	const button = element.closest('.ts-button');
	if (button && (!boundary || boundary.contains(button)))
		inferTokensFromComputedStyle(button, record);

	const bindings: TokenInspectBinding[] = [];

	for (const [token, vias] of viaMap) {
		const chain = [...new Set(resolveTokenChain(token, assignmentMap))];
		allTokens.add(token);
		for (const ref of chain)
			allTokens.add(ref);

		bindings.push({
			token,
			chain,
			usedVia: Array.from(vias).sort()
		});
	}

	bindings.sort((a, b) => bindingPriority(a) - bindingPriority(b) || a.token.localeCompare(b.token));

	return {
		bindings,
		tokens: Array.from(allTokens).sort()
	};
};

/** One-line summary for the inspect toolbar hint. */
export const formatInspectSummary = (result: ElementTokenInspectResult): string => {
	if (!result.bindings.length)
		return 'No design tokens matched this element.';
	const primary = result.bindings[0];
	const chain = primary.chain.length
		? ` → ${primary.chain.map(t => t.replace(/^--/, '')).join(' → ')}`
		: '';
	return `${primary.token.replace(/^--/, '')}${chain}${result.bindings.length > 1 ? ` (+${result.bindings.length - 1} more)` : ''}`;
};
