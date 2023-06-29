import {Module} from '@nu-art/ts-common';
import {User_Group} from '../..';
import {ModuleBE_PermissionsAssert} from './ModuleBE_PermissionsAssert';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export class PermissionsShare_Class
	extends Module {

	async verifyPermissionGrantingAllowed(granterUserId: string, shareGroup: User_Group, mem: MemStorage) {
		await ModuleBE_PermissionsAssert.assertUserSharingGroup(granterUserId, shareGroup, mem);
	}

}

export const PermissionsShare = new PermissionsShare_Class();