import {DBProto} from '@thunder-storm/common';


export type ItemEditor_FilterType<Proto extends DBProto<any>> = (item: Proto['uiType']) => boolean
export type ItemEditor_SortType<Proto extends DBProto<any>> = (item: Proto['uiType']) => string | number;
export type ItemEditor_MapperType<Proto extends DBProto<any>> = (item: Proto['uiType']) => string[];

