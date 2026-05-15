import {Module} from '@nu-art/ts-common';
import {ModuleBE_Email} from './ModuleBE_Email.js';
import {SendGridAdapter} from './adapters/SendGridAdapter.js';

export const ModulePackBE_Email: Module[] = [
	ModuleBE_Email,
	SendGridAdapter,
];
