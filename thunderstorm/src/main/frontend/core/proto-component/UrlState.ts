import {ProtoComponentDef} from './types';
import {
	BadImplementationException,
	compare,
	deepClone,
	Logger
} from '@nu-art/ts-common';
import {
	ModuleFE_BrowserHistoryV2,
	OnUrlParamsChangedListenerV2
} from '../../modules/ModuleFE_BrowserHistoryV2';
import {ComponentSync} from '../ComponentSync';


export class UrlState<Def extends ProtoComponentDef<any, any>>
	extends Logger {

	private keys: Def['props']['keys'];

	constructor(keys: Def['props']['keys'], _component: ComponentSync<any, any>) {
		super();

		this.keys = keys;

		const component = _component as unknown as ComponentSync<any, Def['state']> & OnUrlParamsChangedListenerV2;
		component.__onUrlParamsChangedV2 = () => {
			const previousResultsObject = component.state?.previousResultsObject;
			const queryParams = this.getQueryParamResultsObject();
			const hasChanges = !compare(queryParams, previousResultsObject);
			this.logDebug(`Query params has changes: ${hasChanges}`, previousResultsObject, queryParams);
			if (!hasChanges)
				return;

			component.reDeriveState({previousResultsObject: deepClone(queryParams)} as Def['state']);
		};
	}


	/**
	 * Generates an object connection each query param key given in the props to its current value as read from the URL
	 */
	private getQueryParamResultsObject() {
		try {
			return this.keys.reduce((map, key) => {
				map[key] = this.getQueryParam(key);
				return map;
			}, {} as NonNullable<Def['state']['previousResultsObject']>);
		} catch (err: any) {
			throw new BadImplementationException('proto component implementation must implement default props with keys', err);
		}
	}

	/**
	 * Will set a value in the URL hash for a given key.
	 * @param key
	 * @param value
	 */
	setQueryParam<K extends Def['queryParamKeys'] = Def['queryParamKeys']>(key: K, value: Def['queryParamDef'][K]) {
		ModuleFE_BrowserHistoryV2.set(key, value);
	}

	/**
	 * Retrieves the value of the specified query parameter.
	 *
	 * @param {K} key - The query parameter key.
	 * @return {Def['queryParamDef'][K] | undefined} - The value of the specified query parameter, or undefined if it doesn't exist.
	 */
	getQueryParam<K extends Def['queryParamKeys']>(key: K): Readonly<Def['queryParamDef'][K]> | undefined;

	/**
	 * Retrieves the value of the specified query parameter from the URL.
	 *
	 * @param {K} key - The key of the query parameter to retrieve. Must be one of the defined query parameter keys.
	 * @param {Def.queryParamDef[K]} defaultValue - The default value to return if the query parameter is not found in the URL.
	 * @returns {Def.queryParamDef[K]} - The value of the specified query parameter, or the default value if not found.
	 */
	getQueryParam<K extends Def['queryParamKeys']>(key: K, defaultValue: Def['queryParamDef'][K]): Readonly<Def['queryParamDef'][K]>;

	getQueryParam<K extends Def['queryParamKeys']>(key: K, defaultValue?: Def['queryParamDef'][K]) {
		return ModuleFE_BrowserHistoryV2.get(key) as Readonly<Def['queryParamDef'][K]> ?? Object.freeze(defaultValue);
	}

	/**
	 * Clears the value of a query param by a given key
	 * @param key
	 */
	deleteQueryParam(key: Def['queryParamKeys']) {
		ModuleFE_BrowserHistoryV2.delete(key);
	}

	// ######################## Multiples

	/**
	 * Will merge the given query object into the URL.
	 * @param query
	 */
	setQueryParams(query: Partial<Def['queryParamDef']>) {
		ModuleFE_BrowserHistoryV2.setObject(query);
	}
}