import {Module} from "@nu-art/ts-common";
import {
	User_Group
} from "../..";
import {
	ModuleBE_PermissionsAssert
} from "./ModuleBE_PermissionsAssert";


export class PermissionsShare_Class
	extends Module {

	async verifyPermissionGrantingAllowed(granterUserId: string, shareGroup: User_Group) {
		await ModuleBE_PermissionsAssert.assertUserSharingGroup(granterUserId, shareGroup);
	}

}

export const PermissionsShare = new PermissionsShare_Class();