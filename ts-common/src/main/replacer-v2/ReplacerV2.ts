import {filterInstances} from '../utils/array-tools.js';


/**
 * Input type for ReplacerV2.
 * 
 * Supports static values (string/number) or functions that compute values.
 */
export type ReplacerV2_Input = {
	[k: string]: (string | number) | ((...params: string[]) => (string | number))
}

/**
 * String replacement utility v2 (simplified version).
 * 
 * **Note**: This class appears to be incomplete - the `replace()` method
 * has unreachable code and doesn't actually perform replacement.
 * 
 * Currently only extracts parameter names but doesn't replace them.
 */
export class ReplacerV2 {
	/** Regex for matching all parameter groups */
	private static Regexp_paramGroup = /\$\{(\{?.*?\}?)\}/g;
	/** Regex for matching a single parameter */
	private static Regexp_param = /\$\{(\{?.*?\}?)\}/;

	/**
	 * Replaces parameters in text.
	 * 
	 * **Note**: Currently incomplete - extracts params but doesn't replace.
	 * Has unreachable code (`return params[0]; return text;`).
	 * 
	 * @param text - Text to process
	 * @param input - Optional parameter values
	 * @returns Unmodified text (implementation incomplete)
	 */
	replace(text: string, input?: ReplacerV2_Input) {
		const params = this.resolveParams(text);
		return params[0];
		return text;
	}

	/**
	 * Extracts parameter names from text.
	 * 
	 * @param text - Text to analyze
	 * @returns Array of parameter names found in text
	 */
	private resolveParams(text: string) {
		const matches = text.match(ReplacerV2.Regexp_paramGroup);
		if (!matches)
			return [];

		return filterInstances(matches.map((param) => param.match(ReplacerV2.Regexp_param)?.[1]));
	}
}