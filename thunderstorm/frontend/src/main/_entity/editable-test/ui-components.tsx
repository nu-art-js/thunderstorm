import {ModuleFE_EditableTest} from './ModuleFE_EditableTest.js';
import {DBItemDropDownMultiSelector} from '../../components/_TS_MultiSelect/DBItemDropDownMultiSelector.js';
import {DBProto_EditableTest} from '@nu-art/thunderstorm-shared/_entity/editable-test/index';
import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown} from '../../components/GenericDropDown/index.js';
import {TS_MultiSelect_V2} from '../../components/TS_MultiSelect/index.js';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_EditableTest> = {
	module: ModuleFE_EditableTest,
	modules: [ModuleFE_EditableTest],
	mapper: item => [item.a],
	placeholder: 'Choose a EditableTest',
	renderer: item => <div className="ll_h_c"> {item.a} </div>
};

export const DropDown_EditableTest = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_EditableTest,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <>{item.a}</>;
	},
	uiSelector: DropDown_EditableTest.selectable,
});

export const MultiSelect_EditableTest = TS_MultiSelect_V2.prepare(Props_MultiSelect);

