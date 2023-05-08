import {UniqueId} from "@nu-art/ts-common";
import { ThunderDispatcher } from "../../core/thunder-dispatcher";

export interface OnDeleteConflicts {
    __onDeleteConflicts: (entity: string, conflictingIds: UniqueId[]) => void;
}
export const dispatch_onDeleteConflicts = new ThunderDispatcher<OnDeleteConflicts, '__onDeleteConflicts'>('__onDeleteConflicts')
