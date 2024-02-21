import * as React from 'react';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools';
import {ComponentSync} from '../../core/ComponentSync';
import {DBProto_EditableTest, ModuleFE_EditableTest, UI_EditableTest} from '../../_entity';
import {TS_EditableItemComponentV3} from '../../components/TS_EditableItemComponent/TS_EditableItemComponent';
import {LL_V_L} from '../../components/Layouts';
import {TS_PropRenderer} from '../../components/TS_PropRenderer';
import {EditableDBItemV3, EditableItem} from '../../utils/EditableItem';
import {TS_DropDown} from '../../components/TS_Dropdown';
import {SimpleListAdapter} from '../../components/adapter/Adapter';


type State = {
	editableItem: EditableItem<UI_EditableTest>
};

export class ATS_EditableItemTesting
	extends ComponentSync<{}, State> {

	static defaultProps = {};

	static screen: AppToolsScreen = {
		name: 'Editable Item Testing',
		key: 'editable-item-testing',
		modulesToAwait: [ModuleFE_EditableTest],
		renderer: this,
		group: ATS_Frontend
	};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state.editableItem ??= this.getEditableItem();
		return state;
	}

	private getInitialItem(): UI_EditableTest {
		return ModuleFE_EditableTest.cache.allMutable()[0] ?? {a: '', b: '', c: '', d: ''};
	}

	private getEditableItem() {
		return new EditableDBItemV3(this.getInitialItem(), ModuleFE_EditableTest, (dbItem) => {
			this.setState({editableItem: this.state.editableItem});
		}).setOnChanged(async editable => this.setState({editableItem: editable})).setAutoSave(true);
	}

	render() {
		return <div>
			<EditableItemTestEditor editable={this.state.editableItem}/>
		</div>;
	}
}

// const EditableInput = TS_InputV2.editable({type: 'text', saveEvent: ['accept', 'blur']});
const Dropdown_Zevel = TS_DropDown.prepareEditable({
	adapter: SimpleListAdapter(['ani', 'pah', 'zevel'], item => <>{item.item}</>),
	placeholder: 'select pah zevel'
});

class EditableItemTestEditor
	extends TS_EditableItemComponentV3<DBProto_EditableTest> {
	render() {
		return <LL_V_L>
			<TS_PropRenderer.Vertical label={'Prop A'}>
				<Dropdown_Zevel editable={this.state.editable} prop={'a'}/>
				{this.state.editable.get('a') === 'zevel' && <div>{this.state.editable.get('a')}</div>}
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Prop B'}>
				<Dropdown_Zevel editable={this.state.editable} prop={'b'}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Prop C'}>
				<Dropdown_Zevel editable={this.state.editable} prop={'c'}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Prop D'}>
				<Dropdown_Zevel editable={this.state.editable} prop={'d'}/>
			</TS_PropRenderer.Vertical>
		</LL_V_L>;
	}
}