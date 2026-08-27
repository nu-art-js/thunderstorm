/**
 * Reads the design-language token contract straight from the loaded CSSOM — the
 * SCSS (@nu-art/thunder-widgets :root + theme [data-theme] blocks) stays the single
 * source of truth; the editor never maintains a parallel token catalog.
 */
import {ModuleFE_Theme, TokenAnimation} from '@nu-art/thunder-theme';

export type TokenGroup = {
	title: string;
	tokens: string[];
};

/** Value kind for link-mode filtering — globals and component refs must match exactly. */
export type TokenValueKind = 'color' | 'length' | 'motion' | 'font-size' | 'font-weight' | 'font-family';

export type TokenLinkMode = {
	componentToken: string;
	requiredKind: TokenValueKind;
};

export type GroupCreateSpec = {
	kind: TokenValueKind;
	prefix: string;
	defaultValue: string;
	/** Typography group — user picks which sub-kind to create. */
	variants?: Array<{label: string; kind: TokenValueKind; prefix: string; defaultValue: string}>;
};

const componentPrefix = (componentId: string) => `--ts-${componentId}--`;

/** All custom-property names declared under :root or any [data-theme=...] rule. */
export const readDeclaredTokenNames = (): string[] => {
	const names = new Set<string>();

	// Primary path: enumerate custom properties declared under :root / [data-theme].
	walkStyleRules(rule => {
		const selector = rule.selectorText;
		if (!selector || (selector !== ':root' && !selector.startsWith('[data-theme')))
			return;
		for (let i = 0; i < rule.style.length; i++) {
			const prop = rule.style.item(i);
			if (prop.startsWith('--'))
				names.add(prop);
		}
	});

	// Fallback: some engines don't enumerate all custom properties from the CSSOM
	// rule iteration (e.g. properties whose values are var() references). Walk
	// computedStyle to catch any we missed. computedStyle doesn't list custom
	// properties in all browsers, so this is additive only.
	try {
		const computed = getComputedStyle(document.documentElement);
		for (let i = 0; i < computed.length; i++) {
			const prop = computed.item(i);
			if (prop.startsWith('--'))
				names.add(prop);
		}
	} catch {
		// Non-critical — proceed with CSSOM-only set.
	}

	return Array.from(names).sort();
};

/** CSSOM globals plus runtime-created globals from the editor. */
export const readAllGlobalTokenNames = (): string[] => {
	const names = new Set(readDeclaredTokenNames().filter(token => !token.startsWith('--ts-')));
	for (const created of ModuleFE_Theme.getCreatedTokens())
		names.add(created.token);
	return Array.from(names).sort();
};

const VAR_REF_SINGLE = /^var\(\s*(--[^,)]+)\s*\)$/;

/** Extract the custom-property name from a pure var() reference value. */
export const parseVarRef = (value: string | undefined): string | undefined => {
	if (!value)
		return undefined;
	const match = value.trim().match(VAR_REF_SINGLE);
	return match ? match[1].trim() : undefined;
};

/** Infer the value kind of a global token from its name. */
export const inferGlobalTokenKind = (token: string): TokenValueKind | undefined => {
	if (token.startsWith('--color-'))
		return 'color';
	if (token.startsWith('--radius-') || token.startsWith('--space-'))
		return 'length';
	if (token.startsWith('--font-size-'))
		return 'font-size';
	if (token.startsWith('--font-weight-'))
		return 'font-weight';
	if (token.startsWith('--font-family'))
		return 'font-family';
	if (token.startsWith('--motion-'))
		return 'motion';
	return undefined;
};

export const globalTokenMatchesKind = (token: string, kind: TokenValueKind): boolean =>
	inferGlobalTokenKind(token) === kind;

/** Whether a global group accepts new tokens for the given link kind. */
export const groupMatchesLinkKind = (groupTitle: string, kind: TokenValueKind): boolean => {
	switch (kind) {
		case 'color':
			return groupTitle === 'Semantic palette';
		case 'length':
			return groupTitle === 'Radii' || groupTitle === 'Spacing';
		case 'motion':
			return groupTitle === 'Motion';
		case 'font-size':
		case 'font-weight':
		case 'font-family':
			return groupTitle === 'Typography';
	}
};

/** Runtime override wins over stylesheet declaration. */
export const effectiveTokenDeclaration = (token: string): string | undefined =>
	ModuleFE_Theme.getOverride(token)?.value ?? declaredTokenValue(token);

/** Create-form spec per global group title. */
export const createSpecForGroup = (title: string): GroupCreateSpec | undefined => {
	switch (title) {
		case 'Semantic palette':
			return {kind: 'color', prefix: '--color-', defaultValue: '#808080'};
		case 'Radii':
			return {kind: 'length', prefix: '--radius-', defaultValue: '4px'};
		case 'Spacing':
			return {kind: 'length', prefix: '--space-', defaultValue: '4px'};
		case 'Motion':
			return {kind: 'motion', prefix: '--motion-', defaultValue: '150ms ease-out'};
		case 'Typography':
			return {
				kind: 'font-size',
				prefix: '--font-size-',
				defaultValue: '14px',
				variants: [
					{label: 'Size', kind: 'font-size', prefix: '--font-size-', defaultValue: '14px'},
					{label: 'Weight', kind: 'font-weight', prefix: '--font-weight-', defaultValue: '500'}
				]
			};
		default:
			return undefined;
	}
};

const KEBAB = /^[a-z][a-z0-9-]*$/;

/** Build a full global token name from a group spec and user suffix; throws on invalid/duplicate. */
export const composeNewGlobalTokenName = (
	spec: Pick<GroupCreateSpec, 'prefix'>,
	suffix: string,
	existing: string[]
): string => {
	const trimmed = suffix.trim().replace(/\s+/g, '-').toLowerCase();
	if (!KEBAB.test(trimmed))
		throw new Error('Use lowercase letters, digits, and hyphens only');
	const token = `${spec.prefix}${trimmed}`;
	if (existing.includes(token))
		throw new Error(`Token already exists: ${token}`);
	return token;
};

const VAR_REF = /var\(\s*(--[^,)]+)/g;

/** Extract custom-property names referenced via var() in a declared value. */
export const collectVarRefs = (value: string): string[] => {
	const refs: string[] = [];
	const re = new RegExp(VAR_REF.source, 'g');
	let match: RegExpExecArray | null;
	while ((match = re.exec(value)) !== null)
		refs.push(match[1].trim());
	return refs;
};

/**
 * Walk every readable CSS style rule across all stylesheets — including rules nested
 * inside grouping rules (@media, @supports). Cross-origin sheets are skipped silently.
 * Single source of truth for CSSOM traversal used by token discovery and inspection.
 */
export const walkStyleRules = (visit: (rule: CSSStyleRule) => void): void => {
	const walk = (rules: CSSRuleList | undefined) => {
		for (const rule of Array.from(rules ?? [])) {
			if (rule instanceof CSSStyleRule) {
				visit(rule);
				continue;
			}
			const group = rule as CSSGroupingRule;
			if (group.cssRules)
				walk(group.cssRules);
		}
	};
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			walk(sheet.cssRules);
		} catch {
			// cross-origin sheet — not readable, skip
		}
	}
};

export type TokenRefCollection = {
	/** referenced token -> the css properties / assignments that referenced it */
	viaMap: Map<string, Set<string>>;
	/** custom-property -> var() refs found in its assigned value (incl. scoped reassignments) */
	assignmentMap: Map<string, string[]>;
};

/** Declarations on a CSSStyleRule — CSSOM .style iteration plus cssText fallback. */
export const parseRuleStyleDeclarations = (rule: CSSStyleRule): Array<{prop: string; value: string}> => {
	const decls: Array<{prop: string; value: string}> = [];
	const seen = new Set<string>();

	for (let i = 0; i < rule.style.length; i++) {
		const prop = rule.style.item(i);
		const value = rule.style.getPropertyValue(prop).trim();
		if (!value)
			continue;
		decls.push({prop, value});
		seen.add(prop);
	}

	// Some bundler/engine paths omit shorthand longhands from rule.style — parse cssText.
	const body = rule.cssText.match(/\{([\s\S]*)\}/)?.[1];
	if (body) {
		for (const chunk of body.split(';')) {
			const colon = chunk.indexOf(':');
			if (colon < 0)
				continue;
			const prop = chunk.slice(0, colon).trim();
			const value = chunk.slice(colon + 1).trim();
			if (!prop || !value || seen.has(prop))
				continue;
			decls.push({prop, value});
		}
	}

	return decls;
};

/**
 * Collect every var() reference and custom-property assignment from the rules whose
 * selector satisfies `matchesSelector`. Captures variant/state-scoped reassignments
 * (e.g. `.ts-button--primary { --ts-button--content-color: var(--color-...) }`) that a
 * :root-only static parse cannot see.
 */
export const collectTokenRefsFromRules = (matchesSelector: (selectorText: string) => boolean): TokenRefCollection => {
	const viaMap = new Map<string, Set<string>>();
	const assignmentMap = new Map<string, string[]>();
	const record = (token: string, via: string) => {
		if (!viaMap.has(token))
			viaMap.set(token, new Set());
		viaMap.get(token)!.add(via);
	};

	walkStyleRules(rule => {
		if (!rule.selectorText || !matchesSelector(rule.selectorText))
			return;
		for (const {prop, value} of parseRuleStyleDeclarations(rule)) {
			for (const ref of collectVarRefs(value))
				record(ref, prop);
			if (prop.startsWith('--')) {
				assignmentMap.set(prop, collectVarRefs(value));
				record(prop, `${prop} ←`);
			}
		}
	});

	return {viaMap, assignmentMap};
};

const MAX_CHAIN_DEPTH = 12;

/**
 * Resolve a token's upstream var() chain, following both :root declarations
 * (`declaredTokenValue`) and scoped reassignments captured in `assignmentMap`.
 * Returns the transitive list of referenced tokens, excluding the token itself.
 */
export const resolveTokenChain = (
	token: string,
	assignmentMap: Map<string, string[]>,
	seen = new Set<string>(),
	depth = 0
): string[] => {
	if (depth >= MAX_CHAIN_DEPTH || seen.has(token))
		return [];
	seen.add(token);

	const out: string[] = [];
	const pushRef = (ref: string) => {
		if (!out.includes(ref))
			out.push(ref);
		out.push(...resolveTokenChain(ref, assignmentMap, seen, depth + 1));
	};

	const declared = declaredTokenValue(token);
	if (declared)
		for (const ref of collectVarRefs(declared))
			pushRef(ref);

	const assigned = assignmentMap.get(token);
	if (assigned)
		for (const ref of assigned)
			pushRef(ref);

	return out;
};

/** Component-specific --ts-<id>--* tokens only (no globals). */
export const componentTokenGroups = (componentId: string): TokenGroup[] => {
	const prefix = componentPrefix(componentId);
	const tokens = readDeclaredTokenNames().filter(token => token.startsWith(prefix));
	return tokens.length ? [{title: `${componentId} tokens`, tokens}] : [];
};

/**
 * Group a set of global semantic tokens by domain. Single source of truth for the
 * Theme Editor and the Component Editor's referenced-globals panel, so both render
 * with the identical `layout='global'` grid (palette / radii / spacing / typography / motion).
 */
export const groupGlobalTokens = (tokens: string[]): TokenGroup[] => {
	const byPrefix = (prefix: string) => tokens.filter(token => token.startsWith(prefix));
	const groups: TokenGroup[] = [];

	const colors = byPrefix('--color-');
	if (colors.length)
		groups.push({title: 'Semantic palette', tokens: colors});

	const radii = byPrefix('--radius-');
	if (radii.length)
		groups.push({title: 'Radii', tokens: radii});

	const space = byPrefix('--space-');
	if (space.length)
		groups.push({title: 'Spacing', tokens: space});

	const font = byPrefix('--font-');
	if (font.length)
		groups.push({title: 'Typography', tokens: font});

	const motion = byPrefix('--motion-');
	if (motion.length)
		groups.push({title: 'Motion', tokens: motion});

	return groups;
};

/** Global semantic tokens grouped by domain — for Theme Editor mode. */
export const globalTokenGroups = (): TokenGroup[] =>
	groupGlobalTokens(readAllGlobalTokenNames());

/**
 * Globals a component depends on — union of:
 * 1. Direct var() refs on matched component CSS rules (variant/state colours, etc.)
 * 2. Transitive refs from each --ts-{id}--* token declared in the :root contract
 *    (spacing, radii, motion, … even when the live rule only references the slot token)
 */
export const referencedGlobalsForComponent = (componentId: string): TokenGroup[] => {
	const classRe = new RegExp(`\\.ts-${componentId}(--|[^\\w-]|$)`);
	const {viaMap, assignmentMap} = collectTokenRefsFromRules(selector => classRe.test(selector));
	const prefix = componentPrefix(componentId);
	const globals = new Set<string>();

	const consider = (token: string) => {
		if (token.startsWith('--') && !token.startsWith('--ts-'))
			globals.add(token);
	};

	const absorbChain = (token: string) => {
		for (const ref of resolveTokenChain(token, assignmentMap))
			consider(ref);
	};

	for (const token of viaMap.keys()) {
		consider(token);
		absorbChain(token);
	}

	for (const token of readDeclaredTokenNames().filter(t => t.startsWith(prefix))) {
		absorbChain(token);
		const effective = effectiveTokenDeclaration(token);
		if (effective) {
			for (const ref of collectVarRefs(effective)) {
				consider(ref);
				absorbChain(ref);
			}
		}
	}

	for (const created of ModuleFE_Theme.getCreatedTokens()) {
		for (const token of readDeclaredTokenNames().filter(t => t.startsWith(prefix))) {
			const effective = effectiveTokenDeclaration(token);
			if (effective && collectVarRefs(effective).includes(created.token)) {
				globals.add(created.token);
				break;
			}
		}
	}

	return groupGlobalTokens(Array.from(globals).sort());
};

/** @deprecated Use componentTokenGroups + globalTokenGroups in mode-specific views. */
export const tokenGroupsForComponent = (componentId?: string): TokenGroup[] => {
	const groups: TokenGroup[] = [];
	if (componentId)
		groups.push(...componentTokenGroups(componentId));
	groups.push(...globalTokenGroups().filter(g => g.title === 'Semantic palette'));
	return groups;
};

/** The currently resolved (computed) value of a token on the document root. */
export const resolvedTokenValue = (token: string): string =>
	getComputedStyle(document.documentElement).getPropertyValue(token).trim();

/**
 * The raw declared value of a token as written in the stylesheet (e.g. "var(--color-action-primary-bg)").
 * Returns undefined if not found in any :root or [data-theme] rule.
 */
export const declaredTokenValue = (token: string): string | undefined => {
	let found: string | undefined;
	walkStyleRules(rule => {
		if (found !== undefined)
			return;
		const selector = rule.selectorText;
		if (!selector || (selector !== ':root' && !selector.startsWith('[data-theme')))
			return;
		const raw = rule.style.getPropertyValue(token).trim();
		if (raw)
			found = raw;
	});
	return found;
};

/**
 * Theme-aware declared value: prefers the value declared under [data-theme='<theme>'],
 * falling back to the :root default. CSSOM selector quotes are normalised (engines may
 * emit single or double quotes). theme=undefined → :root only. Used by the layer exports
 * so a theme's own L2 values win over the base contract.
 */
export const declaredTokenValueForTheme = (token: string, theme?: string): string | undefined => {
	let themeVal: string | undefined;
	let rootVal: string | undefined;
	const themeSelector = theme ? `[data-theme=${theme}]` : undefined;
	walkStyleRules(rule => {
		const selector = rule.selectorText;
		if (!selector)
			return;
		if (selector === ':root') {
			const raw = rule.style.getPropertyValue(token).trim();
			if (raw)
				rootVal = raw;
			return;
		}
		if (themeSelector && selector.replace(/["']/g, '').includes(themeSelector)) {
			const raw = rule.style.getPropertyValue(token).trim();
			if (raw)
				themeVal = raw;
		}
	});
	return themeVal ?? rootVal;
};

type RGBA = { r: number; g: number; b: number; a: number };

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHex2 = (n: number) => clamp255(n).toString(16).padStart(2, '0');

/** Parse any CSS colour the contract uses (#rgb/#rrggbb/#rrggbbaa, rgb(), rgba()). */
export const parseColor = (value: string): RGBA | undefined => {
	const v = value.trim();

	if (v === 'transparent')
		return {r: 0, g: 0, b: 0, a: 0};

	const hex = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
	if (hex) {
		const h = hex[1];
		const at = (s: string) => parseInt(s, 16);
		if (h.length === 3)
			return {r: at(h[0] + h[0]), g: at(h[1] + h[1]), b: at(h[2] + h[2]), a: 1};
		if (h.length === 6)
			return {r: at(h.slice(0, 2)), g: at(h.slice(2, 4)), b: at(h.slice(4, 6)), a: 1};
		return {r: at(h.slice(0, 2)), g: at(h.slice(2, 4)), b: at(h.slice(4, 6)), a: at(h.slice(6, 8)) / 255};
	}

	const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
	if (rgb) {
		const rawAlpha = rgb[4];
		const a = rawAlpha === undefined ? 1 : (rawAlpha.endsWith('%') ? parseFloat(rawAlpha) / 100 : parseFloat(rawAlpha));
		return {r: +rgb[1], g: +rgb[2], b: +rgb[3], a};
	}

	return undefined;
};

export const isColor = (value: string): boolean => !!parseColor(value);

/** The RGB part as a 6-digit hex usable in <input type="color">, or undefined. */
export const asColorInputValue = (value: string): string | undefined => {
	const c = parseColor(value);
	return c && `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`;
};

/** The alpha channel of a colour value (1 when opaque / not a colour). */
export const colorAlpha = (value: string): number => parseColor(value)?.a ?? 1;

/**
 * Compose a token value from an RGB hex and alpha. Convention: opaque → #rrggbb,
 * translucent → rgba(r,g,b,a) — keeps alpha human-readable in source.
 */
export const composeColor = (rgbHex: string, alpha: number): string => {
	const c = parseColor(rgbHex) ?? {r: 0, g: 0, b: 0, a: 1};
	if (alpha >= 1)
		return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`;
	return `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${Math.round(alpha * 100) / 100})`;
};

/** Parsed scalar fragment of a token value — for theme-editor value sliders. */
export type NumericTokenSpec = {
	value: number;
	unit: string;
	/** Trailing CSS after the number (e.g. ` ease-out` on motion tokens). */
	suffix: string;
	min: number;
	max: number;
	step: number;
};

const numericSliderRange = (token: string, unit: string): Pick<NumericTokenSpec, 'min' | 'max' | 'step'> => {
	if (token.startsWith('--radius-'))
		return {min: 0, max: unit === 'px' ? 48 : 3, step: unit === 'px' ? 1 : 0.05};
	if (token.startsWith('--space-'))
		return {min: 0, max: unit === 'px' ? 64 : 4, step: unit === 'px' ? 1 : 0.05};
	if (token.startsWith('--font-size-'))
		return {min: 8, max: 32, step: 1};
	if (token.startsWith('--font-weight-'))
		return {min: 100, max: 900, step: 100};
	if (token.startsWith('--motion-'))
		return {min: 0, max: 600, step: 10};
	if (unit === 'ms')
		return {min: 0, max: 600, step: 10};
	if (unit === 'px')
		return {min: 0, max: 64, step: 1};
	return {min: 0, max: 100, step: 1};
};

/** When the resolved value is a single number (+ optional unit), expose slider bounds. */
export const parseNumericTokenValue = (token: string, value: string): NumericTokenSpec | undefined => {
	const v = value.trim();
	if (!v || v.startsWith('var(') || parseColor(v))
		return undefined;

	const motion = v.match(/^([\d.]+)ms(\s+.*)?$/);
	if (motion) {
		const n = parseFloat(motion[1]);
		if (!Number.isFinite(n))
			return undefined;
		const range = numericSliderRange(token, 'ms');
		return {value: n, unit: 'ms', suffix: motion[2] ?? '', ...range};
	}

	const length = v.match(/^(-?[\d.]+)(px|rem|em)$/);
	if (length) {
		const n = parseFloat(length[1]);
		if (!Number.isFinite(n))
			return undefined;
		const unit = length[2];
		return {value: n, unit, suffix: '', ...numericSliderRange(token, unit)};
	}

	const unitless = v.match(/^-?[\d.]+$/);
	if (unitless) {
		const n = parseFloat(v);
		if (!Number.isFinite(n))
			return undefined;
		return {value: n, unit: '', suffix: '', ...numericSliderRange(token, '')};
	}

	return undefined;
};

export const composeNumericTokenValue = (spec: Pick<NumericTokenSpec, 'unit' | 'suffix'>, n: number): string => {
	const rounded = spec.unit === 'px' || spec.unit === 'ms'
		? Math.round(n)
		: spec.unit
			? Math.round(n * 100) / 100
			: Math.round(n);
	if (spec.unit === 'ms')
		return `${rounded}ms${spec.suffix}`;
	if (spec.unit)
		return `${rounded}${spec.unit}`;
	return `${rounded}`;
};

/** Curated font stacks offered as a dropdown for --font-family-* tokens. */
export const FONT_FAMILY_OPTIONS: string[] = [
	'Inter Tight, Inter, sans-serif',
	'"Inter", sans-serif',
	'system-ui, sans-serif',
	'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	'"Helvetica Neue", Arial, sans-serif',
	'Georgia, "Times New Roman", serif',
	'"SF Mono", "JetBrains Mono", ui-monospace, monospace'
];

export const isFontFamilyToken = (token: string): boolean => token.startsWith('--font-family');

/**
 * Kind required when linking a component token to a global — from its effective
 * declaration (override or :root) or resolved value as fallback.
 */
export const inferComponentTokenLinkKind = (
	token: string,
	declaredValue: string | undefined
): TokenValueKind | undefined => {
	const varRef = parseVarRef(declaredValue);
	if (varRef) {
		const fromRef = inferGlobalTokenKind(varRef);
		if (fromRef)
			return fromRef;
	}

	const resolved = resolvedTokenValue(token);
	if (isColor(resolved))
		return 'color';

	const numeric = parseNumericTokenValue(token, resolved);
	if (numeric?.unit === 'ms')
		return 'motion';
	if (numeric?.unit)
		return 'length';
	if (numeric && token.startsWith('--font-weight'))
		return 'font-weight';

	if (isFontFamilyToken(token))
		return 'font-family';

	return undefined;
};

/** Create a runtime global and return its name. */
export const createGlobalTokenInGroup = (
	groupTitle: string,
	suffix: string,
	kindOverride?: TokenValueKind,
	initialValue?: string
): string => {
	const spec = createSpecForGroup(groupTitle);
	if (!spec)
		throw new Error(`Cannot create tokens in group: ${groupTitle}`);

	const variant = kindOverride
		? spec.variants?.find(v => v.kind === kindOverride)
		: undefined;
	const active = variant ?? spec;
	const existing = readAllGlobalTokenNames();
	const token = composeNewGlobalTokenName(active, suffix, existing);
	const value = initialValue?.trim() || active.defaultValue;
	ModuleFE_Theme.createGlobalToken(token, active.kind, value);
	return token;
};

/** Font-family options including the current value (prepended if not already listed). */
export const fontFamilyOptions = (current: string): string[] => {
	const trimmed = current.trim();
	if (!trimmed || trimmed.startsWith('var('))
		return FONT_FAMILY_OPTIONS;
	return FONT_FAMILY_OPTIONS.includes(trimmed) ? FONT_FAMILY_OPTIONS : [trimmed, ...FONT_FAMILY_OPTIONS];
};

/** Display min/max labels beside a numeric token slider (unit only, no motion suffix). */
export const formatNumericTokenBound = (n: number, unit: string): string => {
	const rounded = unit === 'px' || unit === 'ms'
		? Math.round(n)
		: unit
			? Math.round(n * 100) / 100
			: Math.round(n);
	if (unit === 'ms')
		return `${rounded}ms`;
	if (unit)
		return `${rounded}${unit}`;
	return `${rounded}`;
};

/**
 * How to "locate" what a token drives: smoothly oscillate the variable's OWN value
 * so every consumer (which reads it via var()) visibly reacts — colours pulse to a
 * highlight (alpha lifted to 1 so even translucent tokens show), lengths grow/shrink.
 * Returns undefined for values we can't animate meaningfully (multi-value, durations).
 */
export const tokenAnimation = (value: string): TokenAnimation | undefined => {
	const color = parseColor(value);
	if (color)
		return {kind: 'color', from: [color.r, color.g, color.b, color.a], to: [255, 45, 149, 1]};

	const length = value.trim().match(/^(-?[\d.]+)(px|rem|em)$/);
	if (length) {
		const n = parseFloat(length[1]);
		return {kind: 'numeric', from: n, to: n * 2.6 + 8, unit: length[2]};
	}

	// Unitless numbers (font-weight, line-height, opacity, z-index…) — pulse to ~2x.
	const number = value.trim().match(/^-?[\d.]+$/);
	if (number) {
		const n = parseFloat(value);
		return {kind: 'numeric', from: n, to: n * 2, unit: ''};
	}

	return undefined;
};
