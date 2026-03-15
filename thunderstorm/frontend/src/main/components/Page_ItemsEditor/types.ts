import {DB_Prototype} from '@nu-art/db-api-shared';


export type ItemEditor_FilterType<Proto extends DB_Prototype> = (item: Proto['uiType']) => boolean
export type ItemEditor_CustomSort<Proto extends DB_Prototype> = (item: Proto['uiType'][]) => Proto['uiType'][];
export type ItemEditor_MapperType<Proto extends DB_Prototype> = (item: Proto['uiType']) => string[];

