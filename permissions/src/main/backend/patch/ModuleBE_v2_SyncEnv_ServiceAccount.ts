import {Module} from '@nu-art/ts-common';
import {DefaultDef_ServiceAccount, RequiresServiceAccount, ServiceAccountCredentials} from '@nu-art/thunderstorm/backend/modules/_tdb/service-accounts';


/**
 * this is a temporary class till the project dependency structure would be fixed
 */
export class ModuleBE_v2_SyncEnv_ServiceAccount_Class
	extends Module<ServiceAccountCredentials>
	implements RequiresServiceAccount {

	constructor() {
		super();
		this.setDefaultConfig({serviceAccount: {email: 'sync-manager@nu-art-software.com'}});
	}

	__requiresServiceAccount(): DefaultDef_ServiceAccount | DefaultDef_ServiceAccount[] {
		return {
			moduleName: this.getName(),
			email: this.config.serviceAccount.email,
			groupIds: []
		};
	}
}

export const ModuleBE_v2_SyncEnv_ServiceAccount = new ModuleBE_v2_SyncEnv_ServiceAccount_Class();
