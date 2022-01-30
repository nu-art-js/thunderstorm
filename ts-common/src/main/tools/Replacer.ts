/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Logger} from '../core/logger/Logger';
import {escape_RegExp} from '../utils/string-tools';
import {KeyValue, ObjectTS} from '../utils/types';
import {ValidationException} from '../validator/validator';

export class Replacer
	extends Logger {
	private static RuntimeParam = '__runtime';
	private static Indicator_RuntimeParam = '__';

	private static Regexp_paramGroup = /\$\{(.*?)\}/g;
	private static Regexp_param = /\$\{(.*?)\}/;

	private static Regexp_forLoopGroupStart = /\{\{foreach (.*?) in (.*?)\}\}/g;
	private static Regexp_forLoopParam = /\{\{foreach (.*?) in (.*?)\}\}/;

	private input: ObjectTS = {};
	private aliases: KeyValue[] = [];

	constructor() {
		super();
		// this.setMinLevel(LogLevel.Error);
	}

	setInput(input: ObjectTS, aliases: KeyValue[] = []) {
		this.input = input;
		this.aliases = aliases;
		return this;
	}

	public replace(_content: string, runtime?: ObjectTS) {
		let content = this.replaceLoops(_content, runtime);
		content = this.replaceParams(content, runtime);

		if (_content !== content)
			content = this.replace(content, runtime);

		return content;
	}


	private replaceParams(content: string, runtime?: ObjectTS) {
		const matches = content.match(Replacer.Regexp_paramGroup);
		return matches?.reduce((toRet, match) => {
			const param = match.match(Replacer.Regexp_param)?.[1];
			if (param === undefined)
				return toRet;

			return this.replaceParam(param, toRet, runtime);
		}, content) || content;
	}

	private replaceParam(param: string, toRet: string, runtime?: ObjectTS) {
		const value = this.resolveParamValue(param, runtime);
		return toRet.replace(new RegExp(`\\$\\{${escape_RegExp(param)}\\}`, 'g'), value);
	}

	private replaceLoops(content: string, runtime?: ObjectTS) {
		const matches = content.match(Replacer.Regexp_forLoopGroupStart);
		return matches?.reduce((toRet, match) => {
			const varsMatch = match.match(Replacer.Regexp_forLoopParam) as RegExpMatchArray;
			const string = varsMatch[0];
			const iterable = varsMatch[1];
			const iterator = varsMatch[2];
			const endMatch = `{{/foreach ${iterator}}}`;
			const indexOfEnd = toRet.indexOf(endMatch);
			const fullOriginLoopText = toRet.substring(toRet.indexOf(string), indexOfEnd + endMatch.length);
			const loopText = toRet.substring(toRet.indexOf(string) + string.length, indexOfEnd);

			this.logDebug(`indexOfEnd: ${endMatch} ${indexOfEnd}`);
			this.logDebug(`string: ${string} ${toRet.indexOf(string)}`);
			this.logDebug(`iterable: ${iterable}`);
			this.logDebug(`iterator: ${iterator}`);
			this.logDebug(`loopText: ${loopText}`);

			let loopArray: any;
			const iterableProp = `${iterator}`;
			try {
				loopArray = this.resolveParamValue(iterableProp, runtime);
			} catch (e: any) {
				throw new ValidationException(`Error while looping on variable for parts: `, iterableProp, this.input, e);
			}

			if (!Array.isArray(loopArray))
				this.logWarning(`Loop object is not an array.. found:`, loopArray);

			const replacement = loopArray.reduce((_toRet: string, value: any) => {
				return _toRet + this.replace(loopText, {property: value});
			}, '');

			const s = toRet.replace(fullOriginLoopText, replacement);
			return s;
		}, content) || content;
	}

	private resolveParamValue(_param: string, runtime?: ObjectTS) {
		let param = _param;
		const alias = this.aliases.find(alias => alias.key === param);
		if (alias) {
			this.logInfo('using alias: ', alias);
			param = alias.value || param;
		}
		param = param.replace(/\[/g, '.').replace(/\]/g, '');
		if (param.endsWith('.'))
			param = param.substring(0, param.length - 1);
		if (param.startsWith(Replacer.Indicator_RuntimeParam))
			param = `${Replacer.RuntimeParam}.${param.substring(Replacer.Indicator_RuntimeParam.length)}`;

		const parts = param.split('\.');
		let value: any;
		try {
			if (runtime)
				value = parts.reduce((value, key) => value[key], runtime);
			if (value === undefined)
				value = parts.reduce((value, key) => value[key], this.input);
		} catch (e: any) {
			this.logWarning('input', this.input);
			throw new ValidationException(`Error while resolving runtime variable for parts ${param}`, param, this.input, e);
		}
		if (value === undefined) {
			this.logWarning('input', this.input);
			throw new ValidationException(`Cannot resolve runtime variable for parts ${param}`, param, this.input);
		}

		return value;
		// this.logDebug(`Input:`, this.input);
		// this.logDebug(`Param: ${param}`, 'Parts: ', parts);
		// this.logDebug(value);
	}
}