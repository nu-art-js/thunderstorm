import {_keys, currentTimeMillis, Module} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {ApiDef_FocusedObject, FocusData_Object, Request_UpdateFocusObject} from '../../shared';

type Config = {
	focusTTL?: number
}

export class ModuleBE_FocusedObject_Class
	extends Module<Config> {

	protected init() {
		super.init();

		addRoutes([
			createBodyServerApi(ApiDef_FocusedObject._v1.updateFocusObject, this.focusObject),
		]);
	}

	private async focusObject(request: Request_UpdateFocusObject) {
		const objectToWrite: FocusData_Object = {timestamp: currentTimeMillis(), event: 'focus'}; // BE writes the timestamp, not FE. It comes to BE as -1 always.
		const accountId = MemKey_AccountId.get();
		// Go over all COLLECTIONS the user is currently focused on
		await Promise.all((_keys(request.currentFocusMap) as string[]).map(async dbName => {
			// Go over all focused ITEMS
			await Promise.all((_keys(request.currentFocusMap[dbName]) as string[]).map(async itemId => {
				// Write on the ACCOUNT ID of the user
				const writePath = `focusedData/${dbName}/${itemId}/${accountId}/`;
				const writeRef = ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Object>(writePath);
				await writeRef.set(objectToWrite);
			}));
		}));
	}
}

export const ModuleBE_FocusedObject = new ModuleBE_FocusedObject_Class();