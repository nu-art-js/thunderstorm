import {ComponentSync} from '../ComponentSync';
import {BadImplementationException, compare} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistoryV2, OnUrlParamsChangedListenerV2} from '../../modules/ModuleFE_BrowserHistoryV2';
import {ProtoComponentDef} from './types';


/**
 * @abstract
 * @class
 * Expansion on ComponentSync, this component takes a [ProtoComponentDef]{@link ProtoComponentDef} type that
 * defines its interaction with the URL hash. </br>
 * Constrained by the [ProtoComponentDef]{@link ProtoComponentDef}, the component will take an array of query param keys (string[]), and generate, provide functionality
 * and listen on changes in the URL hash. </br>
 * @augments ComponentSync
 * @implements OnUrlParamsChangedListenerV2
 * @copyright nu-art
 */
export abstract class ProtoComponent<Def extends ProtoComponentDef<any, any>, P extends {} = {}, S extends {} = {},
	Props extends Def['props'] & P = Def['props'] & P,
	State extends Def['state'] & S = Def['state'] & S>
	extends ComponentSync<Props, State>
	implements OnUrlParamsChangedListenerV2 {

	// ######################## Life Cycle ########################

	/**
	 * Listener for URL changes triggered by ModuleFE_BrowserHistoryV2.
	 * Will trigger deriveStateFromProps with the new state of the query params set to be the previous state,
	 * if there were changes in the hash that are relevant to this component.
	 */
	__onUrlParamsChangedV2 = () => {
		const previousResultsObject = this.state?.previousResultsObject;
		const queryParams = this.getQueryParamResultsObject();
		const hasChanges = !compare(queryParams, previousResultsObject);
		this.logDebug(`Query params has changes: ${hasChanges}`, previousResultsObject, queryParams);
		if (hasChanges) {
			this.reDeriveState({previousResultsObject: queryParams} as State);
		}
	};

	// ######################## Class Methods ########################

	/**
	 * Generates an object connection each query param key given in the props to its current value as read from the URL
	 */
	private getQueryParamResultsObject() {
		try {
			return this.props.keys.reduce((map, key) => {
				map[key] = this.getQueryParam(key);
				return map;
			}, {} as NonNullable<Def['state']['previousResultsObject']>);
		} catch (err: any) {
			throw new BadImplementationException('proto component implementation must implement default props with keys', err);
		}
	}

	// ######################## Singulars

	/**
	 * Will set a value in the URL hash for a given key.
	 * @param key
	 * @param value
	 */
	setQueryParam<K extends Def['queryParamKeys'] = Def['queryParamKeys']>(key: K, value: Def['queryParamDef'][K]) {
		this.logDebug(this.constructor.name);
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