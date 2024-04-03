import {CSVModuleV3_Class} from './CSVModuleV3';
import {TS_Object} from '../utils/types';
import {_keys} from '../utils/object-tools';
import {__stringify} from '../utils/tools';
import {Readable, Writable} from 'stream';
import * as csv from 'fast-csv';

type Output<T extends TS_Object> = {
	[K in keyof T]: T[K] extends object ? string : T[K];
}

export class JSONCSVModule_Class<I extends TS_Object, O extends Output<I> = Output<I>>
	extends CSVModuleV3_Class {

	private keysToStringify: (keyof I)[];

	constructor(keysToStringify: (keyof I)[]) {
		super();
		this.keysToStringify = keysToStringify;
	}

	private processToJSON = (i: I): O => {
		const o = {} as O;
		_keys(i).forEach(k => {
			if (this.keysToStringify.includes(k))
				return o[k] = __stringify(i[k]) as O[keyof I];
			o[k] = i[k] as unknown as O[keyof I];
		});
		return o;
	};

	private processFromJSON = (o: O): I => {
		const i = {} as I;
		_keys(o).forEach(_k => {
			const k = _k as keyof I;
			if (this.keysToStringify.includes(k)) {
				return i[k] = JSON.parse(o[k]) as I[keyof I];
			}
			i[k] = o[k] as unknown as I[keyof I];
		});
		return i;
	};

	// @ts-ignore
	protected writeImpl = async (writable: Writable, items: I[], options?: csv.FormatterOptionsArgs<I, O>) => {
		return new Promise<void>((resolve, reject) => {
			const _options: csv.FormatterOptionsArgs<I, O> = {
				...options,
				transform: this.processToJSON
			};
			csv.writeToStream(writable, items, _options)
				.on('finish', () => resolve())
				.on('error', err => reject(err));
		});
	};

	// @ts-ignore
	protected readImpl = async (stream: Readable, processor: (item: I, rowNumber: number, stream: csv.CsvParserStream<csv.ParserRow<any>, csv.ParserRow<any>>) => void): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			let rowIndex = 0;

			const csvParser = csv.parse({headers: true, trim: true});
			csvParser
				.on('data', (instance) => {
					processor(this.processFromJSON(instance), rowIndex++, csvParser);
				})
				.on('error', (err) => reject(err))
				.on('end', () => {
					this.logInfo('read ended');
					resolve();
				});

			stream.pipe(csvParser);
		});
	};
}