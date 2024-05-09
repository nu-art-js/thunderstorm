import {filterInstances} from '../utils/array-tools';


export type ReplacerV2_Input = {
	[k: string]: string | ((...params: string[]) => string)
}

export class ReplacerV2 {
	private static Regexp_paramGroup = /\$\{(\{?.*?\}?)\}/g;
	private static Regexp_param = /\$\{(\{?.*?\}?)\}/;

	replace(text: string, input?: ReplacerV2_Input) {
		const params = this.resolveParams(text);
		return params[0];
		return text;
	}

	private resolveParams(text: string) {
		const matches = text.match(ReplacerV2.Regexp_paramGroup);
		if (!matches)
			return [];

		return filterInstances(matches.map((param) => param.match(ReplacerV2.Regexp_param)?.[1]));
	}
}