import {ApiHandler, MemKey_HttpResponse} from '@nu-art/http-server';
import {ApiDef_Embeds, type API_Embeds} from '@nu-art/embeds-shared';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_Embeds} from './ModuleBE_Embeds.js';

/** Serves the loader script. The framed page itself is the app's (it calls ModuleBE_Embeds.authorizeFrame). */
export class ModuleBE_EmbedsAPI_Class
	extends Module {

	@ApiHandler(ApiDef_Embeds.loader)
	async loader(_params: API_Embeds['loader']['Params']): Promise<string> {
		MemKey_HttpResponse.get().end(200, ModuleBE_Embeds.loaderJs(), {
			'content-type': 'text/javascript; charset=utf-8',
			'cache-control': 'public, max-age=300',
			'x-content-type-options': 'nosniff',
		});
		return '';
	}
}

export const ModuleBE_EmbedsAPI = new ModuleBE_EmbedsAPI_Class();
