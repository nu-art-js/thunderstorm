import {
	Module,
	StringMap
} from "@nu-art/ts-common";
import {PermissionsAssert} from "./permissions-assert";
import { UserUrlsPermissions } from "../../shared/apis";


export class UserUrlsPermissions_Class
	extends Module {

	async getUserUrlsPermissions(projectId: string, urls: UserUrlsPermissions, userId: string, requestCustomField: StringMap) {
		const userUrlsPermissions: UserUrlsPermissions = {};
		const userUrlsPermissionsArray = await Promise.all(Object.keys(urls).map(url => this.isUserHasPermissions(projectId, url, userId, requestCustomField)));
		userUrlsPermissionsArray.forEach(urlPermission => {
			userUrlsPermissions[urlPermission.url] = urlPermission.isAllowed;
		});

		return userUrlsPermissions;
	}

	private async isUserHasPermissions(projectId: string, url: string, userId: string, requestCustomField: StringMap) {
		let isAllowed;

		try {
			await PermissionsAssert.assertUserPermissions(projectId, url, userId, requestCustomField);
			isAllowed = true;
		} catch (e) {
			isAllowed = false;
		}

		return {url, isAllowed}
	}
}

export const UserUrlsPermissionsModule = new UserUrlsPermissions_Class();