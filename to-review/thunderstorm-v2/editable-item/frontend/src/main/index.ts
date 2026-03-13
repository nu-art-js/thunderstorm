/**
 * @nu-art/editable-item — public API.
 *
 * Core + UI components that compile against @nu-art/db-api-frontend, @nu-art/thunder-widgets,
 * and @nu-art/ts-common. Page_ItemsEditor lives in @nu-art/editable-item-items-editor.
 */
export {
	EditableItem,
	EditableDBItem,
	ModuleForEditableItem,
	EditableItemStatus_Saving,
	EditableItemStatus_SavedWithErrors,
	EditableItemStatus_FailedValidation,
	EditableItemStatus_ErrorSaving,
	EditableItemStatus_UnsavedChanges,
	EditableItemStatus_Creating,
	EditableItemStatus_Saved,
	EditableItemStatus_Unknown,
	EditableItem_Status,
	EditableItemStatusListener,
	UIProps_EditableItem,
	Editable_OnError,
	Editable_SaveAction,
	Editable_PreSaveAction,
	Editable_DeleteAction,
	Editable_OnChange,
} from './core/EditableItem.js';

export type {EditableRef} from './components/TS_EditableContent/types.js';
export {
	TS_EditableContent,
	type EditableContentType,
} from './components/TS_EditableContent/TS_EditableContent.js';
export {
	TS_EditableItemComponent,
	TS_EditableItemComponentProto,
} from './components/TS_EditableItemComponent/TS_EditableItemComponent.js';
export {TS_EditableItemStatus} from './components/TS_EditableItemStatus/TS_EditableItemStatus.js';
export {
	TS_EditableItemController,
	type TemplatingProps_EditableItemController,
	type Props_EditableItemController,
} from './components/TS_EditableItemController/TS_EditableItemController.js';

export {EDITABLE} from './editables/index.js';
export {
	GenericDropDown,
	type TemplatingProps_TS_GenericDropDown,
	type AppLevelProps_TS_GenericDropDown,
	type GenericDropDown_DBPointer_Item,
} from './components/TS_DropDown/GenericDropDown.js';
export {
	prepareGenericDropDown,
	prepareGenericDropDown_DBPointers,
	createEditableGenericDropDown,
	createEditableGenericDropDownPointer,
	createSelectableGenericDropDown,
	createSelectableGenericDropDownPointer,
} from './editables/editable-generic-dropdown.js';
export {
	TS_MultiSelect_V2,
	type StaticProps_TS_MultiSelect_V2,
	type DynamicProps_TS_MultiSelect_V2,
	type MultiSelect_Selector,
} from './components/TS_MultiSelect/index.js';
export {
	DBItemDropDownMultiSelector,
	type MultiSelectDropDownPropsV3,
} from './components/_TS_MultiSelect/DBItemDropDownMultiSelector.js';
export type {
	EditableItemProps_TS_DropDown,
	EditableDropDownProps,
	EditableItemProps_GenericDropDown,
	EditableItemProps_GenericDropDown_DBPointer,
	EditableItemProps_TS_Checkbox,
	EditableItemProps_TS_InputV2,
	EditableItemProps_TS_TextAreaV2,
} from './editables/index.js';

export type {
	Props_ItemsEditor,
	State_ItemsEditor,
	MenuAction,
	ItemEditor_FilterType,
	ItemEditor_CustomSort,
	ItemEditor_MapperType,
	ItemEditor_EditorProps,
	Props_ListRenderer,
	Props_Filter,
} from './items-editor-contract.js';
