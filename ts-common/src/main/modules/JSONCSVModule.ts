import {CSVModuleV3_Class} from './CSVModuleV3.js';
import {TS_Object} from '../utils/types.js';
import {_keys} from '../utils/object-tools.js';
import {__stringify} from '../utils/tools.js';
import {Readable, Writable} from 'stream';
import * as csv from 'fast-csv';

/**
 * Output type for CSV where object values are stringified.
 * 
 * Converts object properties to strings while keeping primitives unchanged.
 */
type Output<T extends TS_Object> = {
	[K in keyof T]: T[K] extends object ? string : T[K];
}

/**
 * CSV module that handles JSON serialization for object fields.
 * 
 * Extends CSVModuleV3 to automatically stringify/parse JSON for specified fields.
 * This allows storing complex objects in CSV by converting them to JSON strings.
 * 
 * **Behavior**:
 * - On write: Stringifies specified object fields to JSON strings
 * - On read: Parses JSON strings back to objects for specified fields
 * 
 * @template I - Input item type (with object fields)
 * @template O - Output CSV row type (with object fields as strings)
 */
export class JSONCSVModule_Class<I extends TS_Object, O extends Output<I> = Output<I>>
	extends CSVModuleV3_Class {

	/** Array of keys that should be stringified/parsed as JSON */
	private keysToStringify: (keyof I)[];

	/**
	 * Creates a JSONCSVModule instance.
	 * 
	 * @param keysToStringify - Array of field names that contain objects to stringify
	 */
	constructor(keysToStringify: (keyof I)[]) {
		super();
		this.keysToStringify = keysToStringify;
	}

	/**
	 * Converts input object to CSV output format (stringifies object fields).
	 * 
	 * @param i - Input object
	 * @returns Output object with object fields as JSON strings
	 */
	private processToJSON = (i: I): O => {
		const o = {} as O;
		_keys(i).forEach(k => {
			if (this.keysToStringify.includes(k))
				return o[k] = __stringify(i[k]) as O[keyof I];
			o[k] = i[k] as unknown as O[keyof I];
		});
		return o;
	};

	/**
	 * Converts CSV row back to input format (parses JSON strings to objects).
	 * 
	 * @param o - CSV row object (with JSON strings)
	 * @returns Input object with JSON strings parsed back to objects
	 */
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