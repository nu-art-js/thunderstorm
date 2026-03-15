/*
 * @nu-art/sync-manager-frontend - CSV parser for sync-from-URL
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import * as Papa from 'papaparse';
import type {ParseResult} from 'papaparse';

export type PapaparseConfig = Omit<Papa.ParseRemoteConfig<any>, 'download'>;

class ModuleFE_CSVParser_Class
	extends Module {

	fromURL = async <T>(url: string, _config: PapaparseConfig): Promise<T[]> => {
		return new Promise((resolve, reject) => {
			const userComplete = (_config as { complete?: (r: ParseResult<T>, f: string) => void | Promise<void> }).complete;
			const userError = (_config as { error?: (e: Error) => void }).error;
			const config: Papa.ParseRemoteConfig<T> = {
				header: true,
				..._config,
				download: true,
				complete: async (results: ParseResult<T>, file: string) => {
					if (results.errors?.length)
						this.logError('Parsed with errors', ...results.errors);
					this.logDebug('Parsed metadata', results.meta);
					await userComplete?.(results, file);
					resolve(results.data ?? []);
				},
				error: (err: Error) => {
					userError?.(err);
					reject(err);
				},
			};
			Papa.parse(url, config);
		});
	};
}

export const ModuleFE_CSVParser = new ModuleFE_CSVParser_Class();
