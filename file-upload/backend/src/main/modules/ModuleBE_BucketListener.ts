/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BadImplementationException, Dispatcher} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {ModuleBE_StorageListener} from '@nu-art/firebase-backend';
import {PermissionsGroup_PushMessanger} from '@nu-art/push-pub-sub-backend/core/permissions';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {DefaultDef_ServiceAccount, RequiresServiceAccount, ServiceAccountCredentials} from '@nu-art/thunder-db-api-backend/modules/_tdb/service-accounts';
import {StorageEvent} from 'firebase-functions/storage';


export interface OnAssetUploaded {
	__processAsset(filePath?: string): void;
}

const dispatcher_onAssetUploaded = new Dispatcher<OnAssetUploaded, '__processAsset'>('__processAsset');
type Config = ServiceAccountCredentials & {}

export class ModuleBE_BucketListener_Class
	extends ModuleBE_StorageListener<Config>
	implements RequiresServiceAccount {

	constructor() {
		super();
	}

	async onFinalize(event: StorageEvent): Promise<any> {
		// need to create a dispatch that collects a list of services that requires service account and
		// service account details, the permissions  create project will create these account for the rest of the system ;
		return new MemStorage().init(async () => {
			const accountId = this.config.serviceAccount.accountId;
			if (!accountId)
				throw new BadImplementationException('Need to perform project setup to setup this feature');

			MemKey_AccountId.set(accountId);
			let filePath = event.data.name || '';
			if (filePath.endsWith('}'))
				filePath = filePath.substring(0, filePath.length - 1);

			this.logInfo(`File was added to bucket: ${filePath}`);
			await dispatcher_onAssetUploaded.dispatchModuleAsync(filePath);
			this.logDebug('Object is ', event.data);
			this.logDebug('event is ', event);
		});
	}

	__requiresServiceAccount() {
		const serviceAccount: DefaultDef_ServiceAccount = {
			moduleName: this.getName(),
			email: 'bucket-manager@nu-art-software.com',
			groupIds: [PermissionsGroup_PushMessanger._id]
		};
		return serviceAccount;
	}
}

export const ModuleBE_BucketListener = new ModuleBE_BucketListener_Class();