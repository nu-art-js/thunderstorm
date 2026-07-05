import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef, EventType_Query, stringToUniqueId} from '@nu-art/db-api-shared';
import {ApiCaller} from '@nu-art/http-client';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {
	API_UserPermissions,
	ApiDef_UserPermissions,
	DatabaseDef_UserPermissions,
	DBDef_UserPermissions,
	Response_MyPermissions,
} from '@nu-art/permissions-shared';
import {LoggedStatus, ModuleFE_Account, OnLoginStatusUpdated, SessionKeyFE_Account} from '@nu-art/user-account-frontend';

export interface OnUserPermissionsUpdated {
	__onUserPermissionsUpdated: (...params: ApiCallerEventType<DatabaseDef_UserPermissions['dbType']>) => void;
}

export const dispatch_onUserPermissionsChanged = new ThunderDispatcher<OnUserPermissionsUpdated, '__onUserPermissionsUpdated'>('__onUserPermissionsUpdated');

export class ModuleFE_UserPermissions_Class
	extends ModuleFE_BaseApi<DatabaseDef_UserPermissions>
	implements OnLoginStatusUpdated {

	private myPermissions: string[] = [];

	__onLoginStatusUpdated = () => {
		if (ModuleFE_Account.isStatus(LoggedStatus.LOGGED_IN))
			void this.fetchMyPermissions();
		else if (ModuleFE_Account.isStatus(LoggedStatus.LOGGED_OUT))
			this.myPermissions = [];
	};

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_UserPermissions>(DBDef_UserPermissions),
			crudApiDef: CrudApiDef<DatabaseDef_UserPermissions>(DBDef_UserPermissions.dbKey),
			dispatcher: (...args) => dispatch_onUserPermissionsChanged.dispatchAll(...args),
		});
	}

	protected init() {
		super.init();
		if (ModuleFE_Account.isStatus(LoggedStatus.LOGGED_IN))
			void this.fetchMyPermissions();
	}

	@ApiCaller(ApiDef_UserPermissions.getMyPermissions, {
		onComplete: (m: ModuleFE_UserPermissions_Class, ctx) => m.onMyPermissionsFetched(ctx.response),
	})
	async fetchMyPermissions(_params?: API_UserPermissions['getMyPermissions']['Params']): Promise<Response_MyPermissions> {
		void _params;
		return undefined as unknown as Response_MyPermissions;
	}

	private onMyPermissionsFetched(response: Response_MyPermissions) {
		this.myPermissions = response.scopeEntries;
		dispatch_onUserPermissionsChanged.dispatchAll(EventType_Query, []);
	}

	public getScopeEntries(): string[] {
		const account = SessionKeyFE_Account.get();
		if (!account)
			return this.myPermissions;

		const entityId = stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(account._id);
		const cached = this.cache.unique(entityId);
		if (cached)
			return cached.scopeEntries;

		return this.myPermissions;
	}
}

export const ModuleFE_UserPermissions = new ModuleFE_UserPermissions_Class();
