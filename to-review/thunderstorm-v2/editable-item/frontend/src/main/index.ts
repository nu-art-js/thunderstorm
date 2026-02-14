/**
 * @nu-art/editable-item — public API.
 *
 * Exports only the core EditableItem and EditableDBItemV3 that compile against
 * @nu-art/db-api-frontend and @nu-art/ts-common. Components, controllers, and
 * Page_ItemsEditor that depend on @nu-art/web-client, @nu-art/storm-shared, or
 * legacy thunderstorm APIs are excluded from build until those deps are available.
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
