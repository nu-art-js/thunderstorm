import {Filter, filterDuplicates, ResolvableContent, RuntimeModules, sortArray} from '@nu-art/ts-common';
import {LL_V_L, MandatoryProps_TS_DropDown, SimpleListAdapter, TS_DropDown} from '@nu-art/thunder-widgets';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';


export const Props_DBModulesDropDown: ResolvableContent<MandatoryProps_TS_DropDown<ModuleFE_BaseApi<any>>> = {
	adapter: () => SimpleListAdapter(
		sortArray(
			filterDuplicates(
				RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => !!module.getCollectionName),
				(module: ModuleFE_BaseApi<any>) => module.getCollectionName()
			),
			item => item.getCollectionName()
		),
		module => (
			<LL_V_L>
				<div style={{fontSize: '16px', fontWeight: 'bold'}}>{module.item.getCollectionName()}</div>
				<div style={{fontSize: '12px', color: '#666'}}>{module.item.getCollectionKey()}</div>
			</LL_V_L>
		),
	),
	placeholder: 'DB Module',
	filter: new Filter(module => [module.getCollectionKey(), module.getCollectionName()])
};


export const DropDown_DBModules = TS_DropDown.prepare(Props_DBModulesDropDown);