/*
 * Minimal test entry - only BaseDB, no BaseApi/ApiCaller
 */
import {ModuleFE_BaseDB} from '../main/ModuleFE_BaseDB.js';
import {cleanupDbApiIDB} from './test-utils.js';

declare global {
	interface Window {
		DbApiFrontendMinimal: {
			ModuleFE_BaseDB: typeof ModuleFE_BaseDB;
			cleanupDbApiIDB: typeof cleanupDbApiIDB;
		};
	}
}

window.DbApiFrontendMinimal = {
	ModuleFE_BaseDB,
	cleanupDbApiIDB
};
