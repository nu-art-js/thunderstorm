import * as React from 'react';
import { ResolvableContent, resolveContent } from '@nu-art/ts-common';
import './AwaitSync.scss';
import { ModuleFE_SyncManager, PermissibleModulesUpdated } from '../../modules/sync-manager/ModuleFE_SyncManager.js';
import { ComponentSync } from "@nu-art/thunder-routing";
type Props = React.PropsWithChildren<{
    customLoader?: ResolvableContent<React.ReactNode>;
}>;
type State = {
    awaiting: boolean;
};
export class AwaitSync extends ComponentSync<Props, State> implements PermissibleModulesUpdated {
    __onPermissibleModulesUpdated = () => this.reDeriveState();
    shouldComponentUpdate(): boolean {
        return true;
    }
    protected deriveStateFromProps(nextProps: Props, state: State) {
        // Wait until we've received the list of modules the user has permission to see. Until we have them, we wait.
        state.awaiting = ModuleFE_SyncManager.getPermissibleModuleNames().length === 0;
        return state;
    }
    render() {
        if (!this.state.awaiting)
            return this.props.children;
        if (this.props.customLoader)
            return resolveContent(this.props.customLoader);
        return <div className={'ts-await-sync-loader'} onClick={() => {
                this.logInfo('Awaiting Sync');
            }}/>;
    }
}
