import * as React from 'react';
import {DBItemDropDownMultiSelector, prepareGenericDropDown, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2,} from '@nu-art/editable-item';
import {DatabaseDef_PermissionUser} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionUser} from './ModuleFE_PermissionUser.js';
import {ModuleFE_Account} from '@nu-art/user-account-frontend';
import {MUSTNeverHappenException} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionUser> = {
	module: ModuleFE_PermissionUser,
	modules: [ModuleFE_PermissionUser],
	mapper: item => {
		const account = ModuleFE_Account.cache.unique(item._id);
		if (!account)
			throw new MUSTNeverHappenException(`Could not find account connected to permission-user with id ${item._id}`);
		return [account.email];
	},
	placeholder: 'Choose a PermissionUser',
	renderer: item => {
		const account = ModuleFE_Account.cache.unique(item._id);
		if (!account)
			throw new MUSTNeverHappenException(`Could not find account connected to permission-user with id ${item._id}`);
		return <div className="ll_h_c"> {account.email} </div>;
	}
};

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionUser,
	itemRenderer: (item, onDelete) => {
		const account = ModuleFE_Account.cache.unique(item?._id);
		if (item?._id && !account)
			throw new MUSTNeverHappenException(`Could not find account connected to permission-user with id ${item?._id}`);
		return !account ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{account.email}</>;
	},
	uiSelector: prepareGenericDropDown(Props_DropDown).selectable,
});

export const MultiSelect_PermissionUser = TS_MultiSelect_V2.prepare(Props_MultiSelect) as React.ComponentType<any>;

