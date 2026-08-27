import {CreatedGlobalToken, ModuleFE_Theme, ThemeName, TokenOverride} from '@nu-art/thunder-theme';
import {declaredTokenValueForTheme, readAllGlobalTokenNames, readDeclaredTokenNames} from './token-introspection.js';

/**
 * The theme editor edits two layers and a delta on top of them:
 * - `component-to-theme` (L1): component tokens (--ts-*) → the theme token they are wired to.
 * - `theme-to-value`     (L2): theme/global tokens → their value under the active theme.
 * - `delta`                  : only the live overrides authored for the active theme.
 *
 * Every export is filtered to the active theme: L1/L2 read the theme-aware declared value
 * (a [data-theme] declaration wins over :root), and overrides are included only when they
 * were authored under that same theme. theme=undefined targets the base (:root) layer.
 */
export type ThemeExportLayer = 'component-to-theme' | 'theme-to-value' | 'delta-components' | 'delta-theme';

export type ThemeExport =
	| {layer: 'component-to-theme'; theme?: ThemeName; wiring: Record<string, string>}
	| {layer: 'theme-to-value'; theme?: ThemeName; values: Record<string, string>}
	| {layer: 'delta-components'; theme?: ThemeName; enabled: boolean; overrides: TokenOverride[]}
	| {layer: 'delta-theme'; theme?: ThemeName; enabled: boolean; overrides: TokenOverride[]; created: CreatedGlobalToken[]};

/** Component tokens are the --ts-* layer; everything else is a theme/global token. */
const isComponentToken = (token: string): boolean => token.startsWith('--ts-');

/** Override value only when it was authored under the same theme we are exporting. */
const overrideForTheme = (token: string, theme?: ThemeName): string | undefined => {
	const override = ModuleFE_Theme.getOverride(token);
	return override && override.theme === theme ? override.value : undefined;
};

/** Live override (this theme) wins over the theme-aware declared value. */
const effectiveForTheme = (token: string, theme?: ThemeName): string | undefined =>
	overrideForTheme(token, theme) ?? declaredTokenValueForTheme(token, theme);

/** L1 — component (--ts-*) tokens mapped to their theme-token wiring under the active theme. */
export const buildComponentToThemeExport = (theme?: ThemeName): ThemeExport => {
	const wiring: Record<string, string> = {};
	for (const token of readDeclaredTokenNames().filter(name => name.startsWith('--ts-'))) {
		const value = effectiveForTheme(token, theme);
		if (value)
			wiring[token] = value;
	}
	return {layer: 'component-to-theme', theme, wiring};
};

/** L2 — theme/global tokens mapped to their values under the active theme. */
export const buildThemeToValueExport = (theme?: ThemeName): ThemeExport => {
	const values: Record<string, string> = {};
	for (const token of readAllGlobalTokenNames()) {
		const value = effectiveForTheme(token, theme);
		if (value)
			values[token] = value;
	}
	return {layer: 'theme-to-value', theme, values};
};

/** Delta L1 — only the component→theme overrides authored for the active theme. Lean for agents. */
export const buildDeltaComponentExport = (theme?: ThemeName): ThemeExport => ({
	layer: 'delta-components',
	theme,
	enabled: ModuleFE_Theme.isOverridesEnabled(),
	overrides: ModuleFE_Theme.getOverrides().filter(override => override.theme === theme && isComponentToken(override.token))
});

/** Delta L2 — only the theme-token→value overrides (+ created globals) authored for the active theme. */
export const buildDeltaThemeExport = (theme?: ThemeName): ThemeExport => ({
	layer: 'delta-theme',
	theme,
	enabled: ModuleFE_Theme.isOverridesEnabled(),
	overrides: ModuleFE_Theme.getOverrides().filter(override => override.theme === theme && !isComponentToken(override.token)),
	created: ModuleFE_Theme.getCreatedTokens()
});

/** Number of entries a payload carries — for the editor's "exported N …" confirmation. */
export const themeExportSize = (payload: ThemeExport): number => {
	switch (payload.layer) {
		case 'component-to-theme':
			return Object.keys(payload.wiring).length;
		case 'theme-to-value':
			return Object.keys(payload.values).length;
		case 'delta-components':
			return payload.overrides.length;
		case 'delta-theme':
			return payload.overrides.length + payload.created.length;
	}
};

/** Build the chosen layer for the active theme and publish it to the MCP-readable construct. */
export const publishThemeExport = (build: (theme?: ThemeName) => ThemeExport): ThemeExport => {
	const payload = build(ModuleFE_Theme.getCurrentTheme());
	ModuleFE_Theme.publishExport(payload);
	return payload;
};
