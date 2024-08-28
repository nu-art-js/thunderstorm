import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@thunder-storm/core/frontend';
import * as React from 'react';
import {DBProto_PermissionDomain} from '../shared';
import {ModuleFE_PermissionDomain} from './ModuleFE_PermissionDomain';
import {DBItemDropDownMultiSelector} from '@thunder-storm/core/frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@thunder-storm/styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_PermissionDomain> = {
	module: ModuleFE_PermissionDomain,
	modules: [ModuleFE_PermissionDomain],
	mapper: item => [item.namespace],
	placeholder: 'Choose a PermissionDomain',
	renderer: item => <>{item.namespace}</>
};

export const DropDown_PermissionDomain = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionDomain,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.namespace}</>;
	},
	uiSelector: DropDown_PermissionDomain.selectable,
});

export const MultiSelect_PermissionDomain = TS_MultiSelect_V2.prepare(Props_MultiSelect);

