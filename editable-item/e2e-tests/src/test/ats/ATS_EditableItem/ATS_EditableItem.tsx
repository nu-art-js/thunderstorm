/*
 * @nu-art/editable-item-e2e-tests - ATS screen for editable-item demo
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AppToolsScreen, ATS_Frontend, ComponentSync, LL_V_L, SimpleListAdapter, TS_PropRenderer} from '@nu-art/thunder-routing';
import {EditableDBItemV3, EditableItem} from '@nu-art/editable-item';
import type {DatabaseDef_EditableTest, UI_EditableTest} from '../../shared/types.js';
import {ModuleFE_EditableTest} from '../editable-test/ModuleFE_EditableTest.js';
import {TS_EditableContent} from '@nu-art/editable-item';
import {EDITABLE} from '@nu-art/editable-item';

type State = {
	editableItem: EditableItem<UI_EditableTest>;
};

export class ATS_EditableItemTesting
	extends ComponentSync<Record<string, never>, State> {

	static defaultProps = {};
	static screen: AppToolsScreen = {
		name: 'Editable Item Testing',
		key: 'editable-item-testing',
		modulesToAwait: [ModuleFE_EditableTest],
		renderer: this,
		group: ATS_Frontend,
	};

	protected deriveStateFromProps(nextProps: Record<string, never>, state: State): State {
		state.editableItem ??= this.getEditableItem();
		return state;
	}

	private getInitialItem(): UI_EditableTest {
		return ModuleFE_EditableTest.cache.allMutable()[0] ?? {a: '', b: '', c: '', d: ''};
	}

	private getEditableItem(): EditableItem<UI_EditableTest> {
		return new EditableDBItemV3(this.getInitialItem(), ModuleFE_EditableTest as any)
			.setSaveAction(async (dbItem) => {
				this.setState({editableItem: this.state.editableItem});
				return dbItem;
			})
			.setOnChanged(async (editable) => this.setState({editableItem: editable}))
			.setAutoSave(true);
	}

	render() {
		return <div>
			<EditableItemTestEditor editable={this.state.editableItem}/>
		</div>;
	}
}

const Dropdown_Zevel = EDITABLE.DropDown({
	adapter: SimpleListAdapter(['ani', 'pah', 'zevel'], (item) => <>{item.item}</>),
	placeholder: 'select pah zevel',
});

class EditableItemTestEditor
	extends TS_EditableContent<DatabaseDef_EditableTest> {

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
