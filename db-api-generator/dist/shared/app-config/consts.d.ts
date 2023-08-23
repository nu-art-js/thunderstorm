import { TypedKeyValue, UniqueId } from '@nu-art/ts-common';
export type ConfigKey_TagsOrder = TypedKeyValue<'categoriesOrder', any>;
export type ConfigKey_SourceTag = TypedKeyValue<'sourceTag', UniqueId>;
export type ConfigKey_ComplaintsTag = TypedKeyValue<'complaintsTag', UniqueId>;
export type ConfigKey_DiseaseTag = TypedKeyValue<'diseaseCategory', UniqueId>;
export type ConfigKey_DpViewsOrder = TypedKeyValue<'dpViewsOrder', UniqueId[]>;
export type ConfigKey_DiseaseViewTagId = TypedKeyValue<'diseaseViewTagId', UniqueId>;
export type ConfigKey_Scores = TypedKeyValue<'scoresTag', UniqueId>;
export type ConfigKey_SourceVitalSignsTagId = TypedKeyValue<'vitalsSignsTagId', UniqueId>;
export type ConfigKey_SystemsTagIds = TypedKeyValue<'systemsTagIds', UniqueId[]>;
export type ConfigKey_sourceHistoryTagId = TypedKeyValue<'sourceHistoryTagId', UniqueId>;
export type ConfigKey_sourceAdministrativeTagId = TypedKeyValue<'sourceAdministrativeTagId', UniqueId>;
