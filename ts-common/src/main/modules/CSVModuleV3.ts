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

import {Readable, Writable} from 'stream';
import {Module} from '../core/module';
import * as csv from 'fast-csv';

export class CSVModuleV3_Class
	extends Module {

	constructor() {
		super();
	}

	protected init() {
	}

	public readFromStream = async <T>(stream: Readable, processor: (item: T, rowNumber: number, stream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>) => void): Promise<void> => {
		return this.readImpl<T>(stream, processor);
	};

	protected readImpl = async <T>(stream: Readable, processor: (item: T, rowNumber: number, stream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>) => void): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			let rowIndex = 0;

			const csvParser = csv.parse({headers: true, trim: true});
			csvParser
				.on('data', (instance) => {
					processor(instance, rowIndex++, csvParser);
				})
				.on('error', (err) => reject(err))
				.on('end', () => {
					this.logInfo('read ended');
					resolve();
				});

			stream.pipe(csvParser);
		});
	};

	public writeToStream = <I extends csv.FormatterRow = csv.FormatterRow, O extends csv.FormatterRow = csv.FormatterRow>(writable: Writable, items: I[], options?: csv.FormatterOptionsArgs<I, O>) => {
		return this.writeImpl<I>(writable, items, options);
	};

	protected writeImpl = <I extends any>(writable: Writable, items: I[], options?: csv.FormatterOptionsArgs<any, any>) => {
		return new Promise<void>((resolve, reject) => {
			csv.writeToStream(writable, items as csv.FormatterRow[], options)
				.on('finish', () => resolve())
				.on('error', err => reject(err));
		});
	};

	public provideFormatter = (transformer: (item: any) => any = item => item) => {
		return csv.format({headers: true})
			.transform(transformer);
	};

	public provideFormatterFromCsv = (transformer: (item: any) => any = item => item) => {
		return csv.parse({headers: true, trim: true})
			.transform(transformer);
	};

	public fromString = async (str: string) => {
		return new Promise<any[]>((resolve, reject) => {
			const data: any[] = [];
			csv.parseString(str, {headers: true})
				.on('data', row => {
					console.log('HERE - data');
					data.push(row);
				})
				.on('end', () => {
					console.log('HERE - end');
					resolve(data);
				})
				.on('error', err => {
					console.log('HERE - err');
					reject(err);
				});
		});

	};
}

export const CSVModuleV3 = new CSVModuleV3_Class();