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
 * Created by tacb0ss on 07/05/2018.
 */

import {Readable} from 'stream';
import {Module} from '../core/module';
import * as csv from 'fast-csv';


class CSVModuleV3_Class
	extends Module {

	constructor() {
		super();

	}

	protected init() {
	}

	readFromStream = async <T>(stream: Readable, processor: (item: T, rowNumber: number, stream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>) => void): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			let rowIndex = 0;

			const csvStream = csv.parse({headers: true, trim: true});
			csvStream
				.on('data', (instance) => {
					processor(instance, rowIndex++, csvStream);
				})
				.on('error', (err) => reject(err))
				.on('end', () => {
					this.logInfo('read ended');
					resolve();
				});

			stream.pipe(csvStream).pipe({});
		});
	};

	writeToStream = () => {

	};
}

export const CSVModule = new CSVModuleV3_Class();