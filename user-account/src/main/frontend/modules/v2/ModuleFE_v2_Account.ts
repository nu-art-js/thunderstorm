import {ApiCallerEventType, ModuleFE_BaseApi} from '@nu-art/db-api-generator/frontend';
import {ApiDefFE_Account, ApiStructFE_Account, DB_Account_V2, DBDef_Account} from '../../../shared/v2';
import {apiWithBody, apiWithQuery, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';


export interface OnAccountsUpdated {
	__onAccountsUpdated: (...params: ApiCallerEventType<DB_Account_V2>) => void;
}

export const dispatch_onAccountsUpdated = new ThunderDispatcher<OnAccountsUpdated, '__onAccountsUpdated'>('__onAccountsUpdated');

class ModuleFE_Account_v2_Class
	extends ModuleFE_BaseApi<DB_Account_V2, 'email'> {
	readonly vv1: ApiDefCaller<ApiStructFE_Account>['vv1'];

	constructor() {
		super(DBDef_Account, dispatch_onAccountsUpdated);
		this.vv1 = {
			registerAccount: apiWithBody(ApiDefFE_Account.vv1.registerAccount),
			createAccount: apiWithBody(ApiDefFE_Account.vv1.createAccount),
			changePassword: apiWithBody(ApiDefFE_Account.vv1.changePassword),
			login: apiWithBody(ApiDefFE_Account.vv1.login),
			loginSaml: apiWithQuery(ApiDefFE_Account.vv1.loginSaml),
			logout: apiWithQuery(ApiDefFE_Account.vv1.logout),
			validateSession: apiWithQuery(ApiDefFE_Account.vv1.validateSession),
		};
	}
}

export const ModuleFE_AccountV2 = new ModuleFE_Account_v2_Class();
