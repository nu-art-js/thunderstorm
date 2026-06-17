import {BadImplementationException, Module} from '@nu-art/ts-common';

export type ThemeName = string;

/**
 * A theme is just a named set of token values.
 * - Static theme: no `tokens` — its CSS is statically imported (e.g. @app/styles-theme-dark
 *   ships the `[data-theme='dark']{...}` block). The module only needs the name to switch to it.
 * - Dynamic theme: `tokens` provided — the module injects a `[data-theme='<name>']{...}` style
 *   block at runtime. No rebuild. Same switch path as a static theme.
 */
export type ThemeDescriptor = {
	name: ThemeName;
	label: string;
	tokens?: Record<string, string>;
};

/**
 * A single live token override authored from the design-language editor.
 * `theme` records which theme was active when it was set, so the agent reading the
 * dump knows the target source layer (theme-dark / theme-light / …). Undefined means
 * no theme was active — the override targets the base (:root) layer.
 */
export type TokenOverride = {
	token: string;
	value: string;
	enabled: boolean;
	theme?: ThemeName;
};

/** Runtime-authored global token not yet in SCSS — mirrored in the dump for agent write-back. */
export type CreatedGlobalToken = {
	token: string;
	kind: string;
	value: string;
};

/**
 * A transient "locate" animation spec for a token: a colour pulse (RGBA endpoints)
 * or a length grow/shrink (numeric endpoints + unit). Built by the editor from the
 * token's resolved value; the module interpolates it on the document root.
 */
export type TokenAnimation =
	| {kind: 'color'; from: [number, number, number, number]; to: [number, number, number, number]}
	| {kind: 'numeric'; from: number; to: number; unit: string};

const StorageKey_Theme = 'thunder-theme--selected';
const StorageKey_Overrides = 'theme-editor--overrides';
const DumpNodeId = 'theme-editor--dump';
const ExportNodeId = 'theme-editor--export';

/**
 * Generic theming registry. It hardcodes NO themes — the app wires its set via
 * setThemes() (each descriptor carries its own name); dark/light are ordinary
 * registrations, a private case of the general one, never special-cased here.
 * The token contract lives in @nu-art/thunder-widgets :root (theme.scss), so any
 * theme that overrides a subset of tokens is safe (missing tokens fall back to the
 * widget defaults).
 */
export class ModuleFE_Theme_Class
	extends Module {

	private readonly themes: Map<ThemeName, ThemeDescriptor> = new Map();
	private currentTheme?: ThemeName;

	// Live token overrides keyed by token name (one override per token).
	private readonly overrides: Map<string, TokenOverride> = new Map();
	// Globals created in the editor before SCSS write-back.
	private readonly createdGlobals: Map<string, CreatedGlobalToken> = new Map();
	// Master gate: when false, NO override applies (lets the user see the baseline).
	private overridesEnabled = true;

	// Themes the app wires at composition time (each descriptor carries its own name) plus
	// the initial selection. The module presumes NO theme names — dark/light are supplied by
	// the app, not baked into the infra. Declared via setThemes(), consumed in init().
	private themesToRegister: ThemeDescriptor[] = [];
	private initialTheme?: ThemeName;

	protected init() {
		this.themesToRegister.forEach(theme => this.registerTheme(theme));

		const persisted = this.readPersisted();
		const target = (persisted && this.themes.has(persisted)) ? persisted
			: (this.initialTheme && this.themes.has(this.initialTheme)) ? this.initialTheme
				: undefined;
		// No registered theme → stay on the widget :root baseline (no data-theme attribute).
		if (target)
			this.setTheme(target);

		this.readPersistedOverrides();
		this.applyAllOverrides();
	}

	/**
	 * Wire the app's theme set (each descriptor carries its name) and the initial selection.
	 * Call during composition, before build()/init(). dark/light are ordinary entries here.
	 */
	setThemes = (themes: ThemeDescriptor[], initialTheme?: ThemeName) => {
		this.themesToRegister = themes;
		this.initialTheme = initialTheme;
	};

	/** Register a theme. Static (no tokens) or dynamic (tokens injected as a style block). */
	registerTheme = (descriptor: ThemeDescriptor) => {
		this.themes.set(descriptor.name, descriptor);
		if (descriptor.tokens)
			this.injectThemeStyle(descriptor.name, descriptor.tokens);
		this.logDebug(`Registered theme '${descriptor.name}'`);
	};

	setTheme = (name: ThemeName) => {
		if (!this.themes.has(name))
			throw new BadImplementationException(`Unknown theme '${name}' — register it before selecting it`);

		this.currentTheme = name;
		document.documentElement.dataset.theme = name;
		this.persist(name);
		this.logInfo(`Theme set to '${name}'`);
	};

	getThemes = (): ThemeDescriptor[] => Array.from(this.themes.values());

	getCurrentTheme = (): ThemeName | undefined => this.currentTheme;

	// ── live token overrides (design-language editor) ──────────────────────────

	/** Upsert an override for a token (tagged with the active theme) and apply it live. */
	setOverride = (token: string, value: string) => {
		this.overrides.set(token, {token, value, enabled: true, theme: this.currentTheme});
		this.commitOverrides();
	};

	/** Drop an override entirely — the token reverts to its stylesheet value. */
	removeOverride = (token: string) => {
		this.overrides.delete(token);
		document.documentElement.style.removeProperty(token);
		this.commitOverrides();
	};

	/** Toggle a single override on/off without losing its value. */
	setOverrideEnabled = (token: string, enabled: boolean) => {
		const override = this.overrides.get(token);
		if (!override)
			return;
		override.enabled = enabled;
		this.commitOverrides();
	};

	/** Master gate — flip every override on/off at once (preview baseline vs tuned). */
	setAllOverridesEnabled = (enabled: boolean) => {
		this.overridesEnabled = enabled;
		this.commitOverrides();
	};

	clearOverrides = () => {
		this.overrides.forEach(override => document.documentElement.style.removeProperty(override.token));
		this.overrides.clear();
		this.commitOverrides();
	};

	// ── transient "locate" animation ────────────────────────────────────────────
	// Smoothly oscillates a token's value (rAF interpolation) so consumers visibly
	// react — colours pulse to a highlight, lengths grow/shrink — then restores.
	// Deliberately bypasses the override store/persist/dump — it leaves no trace.
	private animFrame?: number;
	private animTokenName?: string;

	// `cycles` MUST be an integer so the final frame lands back on the base value
	// (m=0) — a fractional count ends mid-pulse and snaps on restore.
	animateToken = (token: string, anim: TokenAnimation, durationMs = 1600, cycles = 3) => {
		this.stopAnimation();
		this.animTokenName = token;

		const style = document.documentElement.style;
		const start = performance.now();
		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
		const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

		const frame = (now: number) => {
			const t = Math.min((now - start) / durationMs, 1);
			// Smooth 0 → 1 → 0 oscillation (raised cosine), repeated `cycles` times.
			const m = (1 - Math.cos(t * cycles * 2 * Math.PI)) / 2;

			if (anim.kind === 'color') {
				const c = anim.from.map((v, i) => lerp(v, anim.to[i], m));
				style.setProperty(token, `rgba(${clamp255(c[0])}, ${clamp255(c[1])}, ${clamp255(c[2])}, ${Math.round(c[3] * 100) / 100})`);
			} else {
				style.setProperty(token, `${Math.round(lerp(anim.from, anim.to, m) * 100) / 100}${anim.unit}`);
			}

			if (t < 1)
				this.animFrame = requestAnimationFrame(frame);
			else
				this.stopAnimation();
		};

		this.animFrame = requestAnimationFrame(frame);
	};

	private stopAnimation = () => {
		if (this.animFrame !== undefined) {
			cancelAnimationFrame(this.animFrame);
			this.animFrame = undefined;
		}

		const token = this.animTokenName;
		this.animTokenName = undefined;
		if (!token)
			return;

		// Restore the effective value: an active override if any, else the stylesheet.
		const override = this.overrides.get(token);
		if (this.overridesEnabled && override?.enabled)
			document.documentElement.style.setProperty(token, override.value);
		else
			document.documentElement.style.removeProperty(token);
	};

	getOverrides = (): TokenOverride[] => Array.from(this.overrides.values());

	getOverride = (token: string): TokenOverride | undefined => this.overrides.get(token);

	isOverridesEnabled = (): boolean => this.overridesEnabled;

	/** Register a new global token at runtime and apply its initial value. */
	createGlobalToken = (token: string, kind: string, value: string) => {
		if (!token.startsWith('--'))
			throw new BadImplementationException(`Global token names must start with '--': ${token}`);
		if (this.createdGlobals.has(token))
			throw new BadImplementationException(`Token already created: ${token}`);
		this.createdGlobals.set(token, {token, kind, value});
		this.setOverride(token, value);
	};

	getCreatedTokens = (): CreatedGlobalToken[] => Array.from(this.createdGlobals.values());

	/** Re-apply all overrides to the document, persist, and refresh the read-back dump. */
	private commitOverrides() {
		this.applyAllOverrides();
		this.persistOverrides();
		this.syncDumpNode();
	}

	private applyAllOverrides() {
		const style = document.documentElement.style;
		this.overrides.forEach(override => {
			if (this.overridesEnabled && override.enabled)
				style.setProperty(override.token, override.value);
			else
				style.removeProperty(override.token);
		});
	}

	/**
	 * Mirror the override map into a DOM JSON node so the agent can read the tuned
	 * values back via the MCP `frontend_debug__query_dom` tool and write them to source.
	 */
	private syncDumpNode() {
		this.writeJsonNode(DumpNodeId, {
			enabled: this.overridesEnabled,
			overrides: this.getOverrides(),
			created: this.getCreatedTokens()
		});
	}

	/**
	 * Publish an on-demand export payload (built by the theme editor) to a dedicated
	 * MCP-readable construct (#theme-editor--export), separate from the live overrides
	 * dump so a chosen layer/scope snapshot is not clobbered by subsequent live edits.
	 */
	publishExport = (data: unknown) => this.writeJsonNode(ExportNodeId, data);

	/** Write/replace a head <script type="application/json"> node — the agent read-back construct. */
	private writeJsonNode(id: string, data: unknown) {
		let el = document.getElementById(id) as HTMLScriptElement | null;
		if (!el) {
			el = document.createElement('script');
			el.id = id;
			el.type = 'application/json';
			document.head.appendChild(el);
		}
		el.textContent = JSON.stringify(data, null, 2);
	}

	private persistOverrides() {
		try {
			localStorage.setItem(StorageKey_Overrides, JSON.stringify({
				enabled: this.overridesEnabled,
				overrides: this.getOverrides(),
				created: this.getCreatedTokens()
			}));
		} catch (e: any) {
			this.logWarning('Could not persist token overrides', e);
		}
	}

	private readPersistedOverrides() {
		try {
			const raw = localStorage.getItem(StorageKey_Overrides);
			if (!raw)
				return;
			const parsed = JSON.parse(raw) as {
				enabled?: boolean;
				overrides?: TokenOverride[];
				created?: CreatedGlobalToken[];
			};
			this.overridesEnabled = parsed.enabled ?? true;
			(parsed.overrides ?? []).forEach(override => this.overrides.set(override.token, override));
			(parsed.created ?? []).forEach(created => this.createdGlobals.set(created.token, created));
			this.syncDumpNode();
		} catch (e: any) {
			this.logWarning('Could not read persisted token overrides', e);
		}
	}

	private injectThemeStyle(name: ThemeName, tokens: Record<string, string>) {
		const id = `thunder-theme--${name}`;
		let el = document.getElementById(id) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement('style');
			el.id = id;
			document.head.appendChild(el);
		}

		const body = Object.entries(tokens).map(([key, value]) => `${key}:${value};`).join('');
		el.textContent = `[data-theme='${name}']{${body}}`;
	}

	private persist(name: ThemeName) {
		try {
			localStorage.setItem(StorageKey_Theme, name);
		} catch (e: any) {
			this.logWarning('Could not persist theme selection', e);
		}
	}

	private readPersisted(): ThemeName | undefined {
		try {
			return localStorage.getItem(StorageKey_Theme) ?? undefined;
		} catch (e: any) {
			this.logWarning('Could not read persisted theme selection', e);
			return undefined;
		}
	}
}

export const ModuleFE_Theme = new ModuleFE_Theme_Class();
