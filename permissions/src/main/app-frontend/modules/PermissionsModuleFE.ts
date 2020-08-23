import {
	_clearTimeout,
	_setTimeout,
	ImplementationMissingException,
	Module,
	StringMap
} from "@nu-art/ts-common";
import {ThunderDispatcher} from "@nu-art/thunderstorm/app-frontend/core/thunder-dispatcher";
import { HttpModule } from "@nu-art/thunderstorm/frontend";
import { HttpMethod } from "@nu-art/thunderstorm";
import {
	PermissionsApi_UserUrlsPermissions,
	UserUrlsPermissions
} from "../..";

export type PermissionsModuleFEConfig = {
	projectId: string
}

export interface OnPermissionsChanged {
	__onPermissionsChanged: () => void;
}

const dispatch_onPermissionsChanged = new ThunderDispatcher<OnPermissionsChanged, "__onPermissionsChanged">("__onPermissionsChanged");

export class PermissionsModuleFE_Class
	extends Module<PermissionsModuleFEConfig> {
	private userUrlsPermissions: UserUrlsPermissions = {};
	private requestCustomField: StringMap = {};
	private readonly TIME = 100;
	private timeOutHandle: number = -1;

	setCustomField(key: string, value: string) {
		this.requestCustomField[key] = value;
		this.resetSetPermissionsTimeOut();
	}

	doesUserHavePermissions(url: string) {
		if (this.userUrlsPermissions[url] === undefined) {
			this.userUrlsPermissions[url] = false;
			this.resetSetPermissionsTimeOut();
		}

		return this.userUrlsPermissions[url] === true;
	}

	resetSetPermissionsTimeOut() {
		_clearTimeout(this.timeOutHandle);
		this.setPermissions();
	}

	setPermissions() {
		if (!this.config || !this.config.projectId) {
			throw new ImplementationMissingException("need to set up a project id config");
		}

		this.timeOutHandle = _setTimeout(() => {
			HttpModule
				.createRequest<PermissionsApi_UserUrlsPermissions>(HttpMethod.POST, 'user-urls-permissions')
				.setRelativeUrl(`/v1/permissions/user-urls-permissions`)
				.setOnError(`Failed to get user urls permissions`)
				.setLabel(`Getting user urls permissions`)
				.setJsonBody({
					         projectId: this.config.projectId,
					         urls: this.userUrlsPermissions,
					         requestCustomField: this.requestCustomField
				         })
				.execute(async (userUrlsPermissions: UserUrlsPermissions) => {
					this.userUrlsPermissions = userUrlsPermissions;
					dispatch_onPermissionsChanged.dispatchUI([]);
				});
		}, this.TIME);
	}

}

export const PermissionsFE = new PermissionsModuleFE_Class();