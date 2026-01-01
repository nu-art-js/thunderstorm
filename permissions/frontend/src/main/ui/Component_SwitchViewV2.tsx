import * as React from 'react';
import { ComponentSync } from "@nu-art/thunder-routing";
import { ResolvableContent, resolveContent } from '@nu-art/ts-common';
import { PermissionKey_FE } from '../PermissionKey_FE.js';
import { AccessLevel } from '../modules/ModuleFE_PermissionsAssert.js';
type Modes<T extends string = 'view' | 'edit'> = {
    [key in T]: ResolvableContent<React.ReactNode | undefined>;
};
type Props<T extends string = 'view' | 'edit'> = {
    mode: T;
    modes: Modes<T>;
};
type State<T extends string = 'view' | 'edit'> = {
    mode: T;
    modes: Modes<T>;
};
export const permissionsGuardedRenderer = (permissionKey: PermissionKey_FE, renderer: ResolvableContent<React.ReactNode>) => {
    const accessLevel = permissionKey.getAccessLevel();
    if (accessLevel === AccessLevel.Undefined) {
        console.log(`Data for permission key ${permissionKey.key} does not exist`);
        return;
    }
    if (accessLevel < AccessLevel.HasAccess)
        return;
    return resolveContent(renderer);
};
export class Component_SwitchViewV2 extends ComponentSync<Props, State> {
    // ######################## Lifecycle ########################
    protected deriveStateFromProps(nextProps: Props, state: State) {
        state.mode = nextProps.mode;
        state.modes = nextProps.modes;
        return state;
    }
    // ######################## Render ########################
    render() {
        return resolveContent(this.state.modes[this.state.mode]);
    }
}
