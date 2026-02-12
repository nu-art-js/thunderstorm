import { ResolvableContent } from '@nu-art/ts-common';
import * as React from 'react';
import { TS_Route } from '@nu-art/thunder-routing';
import { ModuleFE_BaseDB } from '@nu-art/thunder-db-api-frontend';
export type AppToolsScreen = {
    key?: string;
    name: string;
    renderer: React.ComponentType<any>;
    icon?: React.ComponentType;
    group?: string;
    children?: TS_Route<any>[];
    modulesToAwait?: ResolvableContent<(ModuleFE_BaseDB<any, any>)[]>;
};
export declare const ATS_3rd_Party = "3rd Party";
export declare const ATS_Fullstack = "Fullstack";
export declare const ATS_Frontend = "Frontend";
export declare const ATS_Backend = "Backend";
export declare const ATS_Garbage = "Garbage";
export declare const ATS_ToRefactor = "To Refactor";
