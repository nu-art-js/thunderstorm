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
import {Module} from '../core/module.js';
import * as csv from 'fast-csv';

/**
 * CSV module v3 for reading and writing CSV data using streams.
 *
 * Provides stream-based CSV processing using the `fast-csv` library.
 * Supports reading from Readable streams and writing to Writable streams,
 * with row-by-row processing for memory efficiency.
 *
 * **Features**:
 * - Stream-based processing (memory efficient for large files)
 * - Header row support (first row treated as column names)
 * - Row trimming (whitespace removed from values)
 * - Custom formatters and transformers
 */
export class CSVModuleV3_Class
	extends Module {

	constructor() {
		super();
	}

	protected init() {
	}

	/**
	 * Reads CSV data from a stream, processing each row.
	 *
	 * Parses CSV with headers and calls the processor function for each row.
	 * The processor receives the row data, row number (0-indexed), and the parser stream.
	 *
	 * **Note**: The processor can call methods on the stream (e.g., `stream.destroy()`)
	 * to control parsing.
	 *
	 * @template T - Row data type
	 * @param stream - Readable stream containing CSV data
	 * @param processor - Function called for each row
	 * @returns Promise that resolves when stream ends
	 */
	public readFromStream = async <T>(stream: Readable, processor: (item: T, rowNumber: number, stream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>) => void): Promise<void> => {
		return this.readImpl<T>(stream, processor);
	};

	/**
	 * Internal implementation of stream reading.
	 *
	 * @template T - Row data type
	 * @param stream - Readable stream containing CSV data
	 * @param processor - Function called for each row
	 * @returns Promise that resolves when stream ends
	 */
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

	/**
	 * Internal implementation of stream writing.
	 *
	 * @template I - Input item type
	 * @param writable - Writable stream to write CSV to
	 * @param items - Array of items to write
	 * @param options - CSV formatting options
	 * @returns Promise that resolves when writing completes
	 */
	protected writeImpl = <I>(writable: Writable, items: I[], options?: csv.FormatterOptionsArgs<any, any>) => {
		return new Promise<void>((resolve, reject) => {
			csv.writeToStream(writable, items as csv.FormatterRow[], options)
				.on('finish', () => resolve())
				.on('error', err => reject(err));
		});
	};

	/**
	 * Creates a CSV formatter stream with optional transformation.
	 *
	 * Returns a stream that formats objects as CSV with headers.
	 * The transformer function can modify each row before formatting.
	 *
	 * @param transformer - Optional function to transform each row (default: identity)
	 * @returns CSV formatter stream
	 */
	public provideFormatter = (transformer: (item: any) => any = item => item) => {
		return csv.format({headers: true})
			.transform(transformer);
	};

	/**
	 * Creates a CSV parser stream with optional transformation.
	 *
	 * Returns a stream that parses CSV and transforms each row.
	 * Headers are parsed and values are trimmed.
	 *
	 * @param transformer - Optional function to transform each parsed row (default: identity)
	 * @returns CSV parser stream with transformation
	 */
	public provideFormatterFromCsv = (transformer: (item: any) => any = item => item) => {
		return csv.parse({headers: true, trim: true})
			.transform(transformer);
	};

	/**
	 * Parses a CSV string into an array of objects.
	 *
	 * **Note**: Contains console.log statements that should be removed in production.
	 *
	 * @param str - CSV string to parse
	 * @returns Promise resolving to array of parsed row objects
	 */
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