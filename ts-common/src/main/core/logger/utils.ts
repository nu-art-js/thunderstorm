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

/**
 * Created by TacB0sS on 3/16/17.
 */

import {removeItemFromArray} from '../../utils/array-tools';
import {__stringify} from '../../utils/tools';
import {LogParam} from './types';


export function _logger_logObject(instance: object): string {
	return __stringify(instance, true);
}

export function _logger_convertLogParamsToStrings(params: LogParam[]): string[] {
	return params.map(toLog => {
		if (typeof toLog === 'undefined')
			return 'undefined';

		if (toLog === null)
			return 'null';

		if (typeof toLog === 'string')
			return toLog;

		if (typeof toLog === 'number')
			return `${toLog}`;

		// @ts-ignore
		if (toLog.stack)
			return _logger_logException(toLog as Error);

		return __stringify(toLog as object, true);
	});
}

export function _logger_logException(error: Error, fullStack = ''): string {
	let toPrint = '';
	let errorMessage;
	let isCustomException = false;

	if (error.stack) {
		const stackAsList = error.stack.split('\n');
		errorMessage = stackAsList[0];

		removeItemFromArray(stackAsList, errorMessage);
		toPrint = stackAsList.reduce((toRet, stacktrace) => {
			if (fullStack.indexOf(stacktrace) !== -1)
				return toRet;

			return toRet + stacktrace + '\n';
		}, toPrint);

		isCustomException = toPrint.indexOf('CustomException') !== -1;
		toPrint = toPrint.replace(/\s+at.*?CustomException.*?\n/, '\n');
		toPrint = toPrint.replace(/\s+at.*?new\s+(.*?) \(.*?\n/, `${fullStack.length === 0 ? '' : '\nCaused by '}$1: ${errorMessage.replace('Error: ', '')}\n`);

		if (!isCustomException && errorMessage)
			toPrint = errorMessage + '\n' + toPrint;
	}

	const cause: any = (error as any).cause;
	if (cause) {
		let causeStack = _logger_logException(cause, toPrint);
		causeStack = causeStack.replace(`Error: ${cause.message}`, `${cause.message}`);
		toPrint += `${causeStack}`;
	}

	return toPrint;
}

export function _logger_indentNewLineBy(linePrefix: string, input: string) {
	return linePrefix + input.replace(/\n/g, `\n${linePrefix}`);
}

