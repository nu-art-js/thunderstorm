import {
	ImplementationMissingException,
	Module,
	StringMap
} from "@nu-art/ts-common";
import {ThunderDispatcher} from "@nu-art/thunderstorm/app-frontend/core/thunder-dispatcher";
import {HttpModule} from "@nu-art/thunderstorm/frontend";
import {HttpMethod} from "@nu-art/thunderstorm";
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
	private loadingUrls = new Set<string>()
	private userUrlsPermissions: UserUrlsPermissions = {};
	private requestCustomField: StringMap = {};
	private readonly TIME = 100;

	setCustomField(key: string, value: string) {
		this.requestCustomField[key] = value;
		this.setPermissions();
	}

	doesUserHavePermissions(url: string): boolean | undefined {
		console.log("doesUserHavePermissions")
		if(this.loadingUrls.has(url))
			return undefined

		const permitted = this.userUrlsPermissions[url];
		if (permitted !== undefined)
			return permitted;

		this.loadingUrls.add(url)
		this.userUrlsPermissions[url] = false
		this.setPermissions();
		return undefined;
	}

	setPermissions() {
		if (!this.config || !this.config.projectId)
			throw new ImplementationMissingException("need to set up a project id config");

		this.debounce(() => {
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
					Object.keys(userUrlsPermissions).forEach(url => this.loadingUrls.delete(url))
					this.userUrlsPermissions = userUrlsPermissions;
					dispatch_onPermissionsChanged.dispatchUI([]);
				});
		}, 'get-permissions', this.TIME);
	}

}

export const PermissionsFE = new PermissionsModuleFE_Class();