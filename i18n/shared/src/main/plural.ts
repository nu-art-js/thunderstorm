export const RtlLanguages = new Set(['ar', 'fa', 'he', 'ur']);

export const languageFromLocaleCode = (localeCode: string): string => localeCode.split(/[_-]/)[0] ?? localeCode;

export const isRtlLanguage = (language: string): boolean => RtlLanguages.has(language);

/**
 * CLDR-style category from language + count. Product bands (few&lt;10, adminTriple, …) are not computed here.
 */
export const pluralCategory = (language: string, count: number): string => {
	const n = Math.abs(count);
	const i = Math.floor(n);

	switch (language) {
		case 'ar':
			if (n === 0) return 'zero';
			if (n === 1) return 'one';
			if (n === 2) return 'two';
			if (i % 100 >= 3 && i % 100 <= 10) return 'few';
			if (i % 100 >= 11 && i % 100 <= 99) return 'many';
			return 'other';
		case 'he':
			if (n === 1) return 'one';
			if (n === 2) return 'two';
			if (n !== 0 && i % 10 === 0) return 'many';
			return 'other';
		case 'ru':
		case 'uk': {
			const mod10 = i % 10;
			const mod100 = i % 100;
			if (mod10 === 1 && mod100 !== 11) return 'one';
			if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
			if (mod10 === 0 || (mod10 >= 5 && mod10 <= 9) || (mod100 >= 11 && mod100 <= 14)) return 'many';
			return 'other';
		}
		default:
			return n === 1 ? 'one' : 'other';
	}
};
