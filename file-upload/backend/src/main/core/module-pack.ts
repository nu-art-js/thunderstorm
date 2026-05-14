import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_FileUpload} from '../modules/ModuleBE_FileUpload.js';


export const ModulePackBE_FileUpload = [
	ModuleBE_FileUpload, createApisForDBModule(ModuleBE_FileUpload),
];
