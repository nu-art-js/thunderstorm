import {DBProto} from '@nu-art/ts-common';


export type ItemEditor_FilterType<Proto extends DBProto<any>> = (item: Proto['uiType']) => boolean
export type ItemEditor_CustomSort<Proto extends DBProto<any>> = (item: Proto['uiType'][]) => Proto['uiType'][];
export type ItemEditor_MapperType<Proto extends DBProto<any>> = (item: Proto['uiType']) => string[];

