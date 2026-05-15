import {__custom, __scenario} from '@nu-art/testelot';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {MyTester} from './core.js';
import {ModulePackBE_FileUpload, ModuleBE_FileUpload} from '../main/index.js';


const mainScenario = __scenario('File Upload Backend Testing');

const testRegisterValidator = __custom(async () => {
	ModuleBE_FileUpload.registerValidator('test-image', {
		allowedMimeTypes: ['image/png', 'image/jpeg'],
		maxSize: 5 * 1024 * 1024,
	});
}).setLabel('Register validator for test-image key');

const testRegisterDuplicateValidator = __custom(async () => {
	ModuleBE_FileUpload.registerValidator('duplicate-key', {
		allowedMimeTypes: ['text/plain'],
	});
	ModuleBE_FileUpload.registerValidator('duplicate-key', {
		allowedMimeTypes: ['application/pdf'],
	});
}).setLabel('Duplicate validator registration throws');

// @ts-ignore — expectToFail exists on testelot __custom
testRegisterDuplicateValidator.expectToFail(Error, (e: Error) => e.message.includes('already registered'));

mainScenario.add(testRegisterValidator);
mainScenario.add(testRegisterDuplicateValidator);

module.exports = new MyTester()
	.addModules(ModuleBE_Firebase)
	.addModules(...ModulePackBE_FileUpload)
	.setScenario(mainScenario)
	.build();
