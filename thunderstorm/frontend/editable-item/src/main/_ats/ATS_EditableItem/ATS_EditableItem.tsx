import {AppToolsScreen, ATS_Frontend, ComponentSync, LL_V_L, SimpleListAdapter, TS_PropRenderer} from '@nu-art/thunderstorm-frontend';
import {EditableDBItemV3, EditableItem} from '../../core/EditableItem.js';
import {DBProto_EditableTest, UI_EditableTest} from '@nu-art/thunderstorm-shared';
import {ModuleFE_EditableTest} from '../editable-test/ModuleFE_EditableTest.js';
import {TS_EditableContent} from '../../controllers/TS_EditableContent/TS_EditableContent.js';
import {EDITABLE} from '../../components/editables.js';


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
		return new EditableDBItemV3(this.getInitialItem(), ModuleFE_EditableTest)
			.setSaveAction(async (dbItem) => {
				this.setState({editableItem: this.state.editableItem});
				return dbItem;
			})
			.setOnChanged(async editable => this.setState({editableItem: editable})).setAutoSave(true);
	}

	render() {
		return <div>
			<EditableItemTestEditor editable={this.state.editableItem}/>
		</div>;
	}
}

// const EditableInput = TS_InputV2.editable({type: 'text', saveEvent: ['accept', 'blur']});
const Dropdown_Zevel = EDITABLE.DropDown({
	adapter: SimpleListAdapter(['ani', 'pah', 'zevel'], item => <>{item.item}</>),
	placeholder: 'select pah zevel'
});

class EditableItemTestEditor
	extends TS_EditableContent<DBProto_EditableTest> {
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