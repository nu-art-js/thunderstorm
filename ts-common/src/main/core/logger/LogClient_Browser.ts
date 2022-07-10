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

import {LogLevel, LogParam} from './types';
import {LogClient} from './LogClient';
import {getLogStyle, LogStyle, TypedMap} from '../..';


class LogClient_Browser_class
	extends LogClient {

	private style: TypedMap<LogStyle> = {
		base: {
			'background-color': '#fff',
			'padding': '2px 0px',
			'border-radius': '2px',
		},
		verbose: {
			'color': '#808080',
			'background-color': 'unset'
		},
		debug: {
			'background-color': '#6564c9',
		},
		info: {
			'background-color': '#189702',
		},
		warning: {
			'background-color': '#926E00',
		},
		error: {
			'background-color': '#B40000',
		}
	};

	getColor(level: LogLevel, bold: boolean): string {
		switch (level) {
			case LogLevel.Verbose:
				return getLogStyle(this.style.base, this.style.verbose);
			case LogLevel.Debug:
				return getLogStyle(this.style.base, this.style.debug);
			case LogLevel.Info:
				return getLogStyle(this.style.base, this.style.info);
			case LogLevel.Warning:
				return getLogStyle(this.style.base, this.style.warning);
			case LogLevel.Error:
				return getLogStyle(this.style.base, this.style.error);
			default:
				return getLogStyle({'color': '#000000'});
		}
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		for (const param of toLog) {
			if (typeof param === 'string') {
				console.log(`%c${prefix}${param}`, this.getColor(level, bold));
				continue;
			}
			if (typeof param === 'object') {
				console.log(`%c${prefix}`, this.getColor(level, bold), param);
				continue;
			}
			console.log(param);
		}
	}
}

export const LogClient_Browser = new LogClient_Browser_class();