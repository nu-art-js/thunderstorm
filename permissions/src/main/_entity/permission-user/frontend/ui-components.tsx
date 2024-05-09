import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {DBProto_PermissionUser} from '../shared';
import {ModuleFE_PermissionUser} from './ModuleFE_PermissionUser';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm/frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {MUSTNeverHappenException} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_PermissionUser> = {
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

export const DropDown_PermissionUser = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionUser,
	itemRenderer: (item, onDelete) => {
		const account = ModuleFE_Account.cache.unique(item?._id);
		if (item?._id && !account)
			throw new MUSTNeverHappenException(`Could not find account connected to permission-user with id ${item?._id}`);
		return !account ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{account.email}</>;
	},
	uiSelector: DropDown_PermissionUser.selectable,
});

export const MultiSelect_PermissionUser = TS_MultiSelect_V2.prepare(Props_MultiSelect);

