import { ApiDefCaller } from '@nu-art/thunderstorm';
import { Module } from '@nu-art/ts-common';
import { ApiStruct_Archiving } from '../../shared/archiving/apis';
declare class ModuleFE_Archiving_Class extends Module {
    readonly vv1: ApiDefCaller<ApiStruct_Archiving>['vv1'];
    constructor();
}
export declare const ModuleFE_Archiving: ModuleFE_Archiving_Class;
export {};
