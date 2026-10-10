import {getAllI18nRegistrations, type I18N_Registration} from './register.js';
import {catalogFromRtdb, textToForms, type I18N_RtdbDefaults} from './catalog.js';

export type I18nCompletenessIssue =
	| { type: 'missing-default'; locale: string; key: string }
	| { type: 'unknown-param'; locale: string; key: string; form: string; param: string }
	| { type: 'unregistered-key'; locale: string; key: string };

export type I18nCompletenessInput = {
	/** Codes of the enabled locales; each must have a default for every registered key. */
	enabledLocales: string[];
	/** The defaults tree as stored in the RTDB (locale → encoded key → text), e.g. merged release deltas. */
	defaults: I18N_RtdbDefaults;
	/** Registered keys; defaults to everything passed to i18nRegister in this process. */
	registrations?: ReadonlyMap<string, I18N_Registration>;
};

export type I18nCompletenessReport = {
	ok: boolean;
	/** Fail the release: a missing default, or a placeholder the key does not declare. */
	errors: I18nCompletenessIssue[];
	/** Do not fail: texts for keys no code registers (stale or not yet released). */
	warnings: I18nCompletenessIssue[];
};

const PlaceholderPattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/** Built-in params the resolver understands without a declaration. */
const ImplicitParams = new Set(['count', 'band']);

/**
 * The CI completeness check: every registered key must have a default in every enabled locale, and
 * defaults may only use placeholders the key declares. Pure; the app's CI calls it after importing
 * its key registrations and loading the defaults it is about to release.
 */
export const checkI18nCompleteness = (input: I18nCompletenessInput): I18nCompletenessReport => {
	const registrations = input.registrations ?? getAllI18nRegistrations();
	const errors: I18nCompletenessIssue[] = [];
	const warnings: I18nCompletenessIssue[] = [];

	for (const locale of [...input.enabledLocales].sort()) {
		const catalog = catalogFromRtdb(input.defaults[locale]);
		for (const [key, registration] of [...registrations.entries()].sort(([a], [b]) => a.localeCompare(b))) {
			const forms = textToForms(catalog[key]);
			if (!forms || !Object.values(forms).some(text => typeof text === 'string' && text.length > 0)) {
				errors.push({type: 'missing-default', locale, key});
				continue;
			}

			for (const [form, text] of Object.entries(forms))
				for (const [, param] of (text ?? '').matchAll(PlaceholderPattern))
					if (!ImplicitParams.has(param) && !registration.params?.[param])
						errors.push({type: 'unknown-param', locale, key, form, param});
		}

		for (const key of Object.keys(catalog).sort())
			if (!registrations.has(key))
				warnings.push({type: 'unregistered-key', locale, key});
	}

	return {ok: errors.length === 0, errors, warnings};
};

export const formatI18nCompletenessReport = (report: I18nCompletenessReport): string => {
	const line = (issue: I18nCompletenessIssue) => {
		switch (issue.type) {
			case 'missing-default':
				return `  [${issue.locale}] ${issue.key}: no default`;
			case 'unknown-param':
				return `  [${issue.locale}] ${issue.key} (${issue.form}): {${issue.param}} is not a declared param`;
			case 'unregistered-key':
				return `  [${issue.locale}] ${issue.key}: no code registers this key`;
		}
	};

	const parts = [`i18n completeness: ${report.errors.length} error(s), ${report.warnings.length} warning(s)`];
	if (report.errors.length)
		parts.push('Errors:', ...report.errors.map(line));
	if (report.warnings.length)
		parts.push('Warnings:', ...report.warnings.map(line));

	return parts.join('\n');
};
