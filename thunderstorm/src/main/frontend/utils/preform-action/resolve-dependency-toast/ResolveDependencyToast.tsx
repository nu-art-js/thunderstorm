import {UniqueId} from '@nu-art/ts-common';
import * as React from 'react';
import { dispatch_onDeleteConflicts } from '../notification-dispatchers';
import './ResolveDependencyToast.scss';

type Props = {
    deletedEntity: string;
    dependencyConflicts: UniqueId[];
}
export default function ResolveDependencyToast(props: Props){
    const renderResolveDependenciesPanel = ()=>{
       dispatch_onDeleteConflicts.dispatchUI(props.deletedEntity, props.dependencyConflicts);
    }

    return (
        <div className={'flex-toast-base'}>
            <div>Entity has dependencies.</div>
            <div
                onClick={()=>renderResolveDependenciesPanel()}
            >
                <span className={'click-here-label'}>Click here</span> to resolve
            </div>
        </div>
    )
}