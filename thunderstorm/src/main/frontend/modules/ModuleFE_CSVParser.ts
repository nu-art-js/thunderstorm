import {Module, tsValidate, tsValidateGeneralUrl} from '@nu-art/ts-common';
import * as Papa from 'papaparse';
import {LocalFile, ParseResult} from 'papaparse';

class ModuleFE_CSVParser_Class
	extends Module {

	fromString = <T>(str: string, _config?: Papa.ParseConfig<T>): T[] => {
		const config: Papa.ParseConfig<T> = {header: true, ..._config ?? {}};
		const parsed = Papa.parse<T>(str, config);
		if (parsed.errors.length)
			this.logError('Parsed with errors', ...parsed.errors);
		this.logDebug('Parsed metadata', parsed.meta);
		return parsed.data;
	};

	fromFile = async <T>(file: LocalFile, _config: Papa.ParseLocalConfig<T, LocalFile>): Promise<T[]> => {
		return new Promise(resolve => {
			const config: Papa.ParseLocalConfig<T, LocalFile> = {
				header: true,
				complete: (results: ParseResult<T>, file: LocalFile) => {
					if (results.errors.length)
						this.logError('Parsed with errors', ...results.errors);
					this.logDebug('Parsed metadata', results.meta);
					resolve(results.data);
				},
				..._config,
			};
			Papa.parse(file, config);
		});
	};

	fromURL = async <T>(url: string, _config: Omit<Papa.ParseRemoteConfig<T>, 'download'>): Promise<T[]> => {
		return new Promise((resolve, reject) => {
			const error = tsValidate(url, tsValidateGeneralUrl());
			if (error)
				reject(error);

			const config: Papa.ParseRemoteConfig<T> = {
				header: true,
				complete: (results: ParseResult<T>, file: string) => {
					if (results.errors.length)
						this.logError('Parsed with errors', ...results.errors);
					this.logDebug('Parsed metadata', results.meta);
					resolve(results.data);
				},
				..._config,
				download: true,
			};
			Papa.parse(url, config);
		});
	};
}

export const ModuleFE_CSVParser = new ModuleFE_CSVParser_Class();