/**
 * @nu-art/editable-item — public API.
 *
 * Core + UI components that compile against @nu-art/db-api-frontend, @nu-art/thunder-widgets,
 * and @nu-art/ts-common. Controllers, editables, and Page_ItemsEditor that depend on
 * @nu-art/storm-shared or legacy APIs remain in _excluded-from-build until migrated.
 * See _thunderstorm/editable-item-imports-dictionary.md and ISSUES.md.
 */
export {
	EditableItem,
	EditableDBItemV3,
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
