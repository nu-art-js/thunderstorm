import {PermissionKey_FE} from '../PermissionKey_FE';
import {PermissionKey_DeveloperAdmin, PermissionKey_DeveloperViewer, PermissionKey_DeveloperWriter} from '../../shared/permission-keys';


export const PermissionKeyFE_DeveloperViewer = new PermissionKey_FE(PermissionKey_DeveloperViewer);
export const PermissionKeyFE_DeveloperEditor = new PermissionKey_FE(PermissionKey_DeveloperWriter);
export const PermissionKeyFE_DeveloperAdmin = new PermissionKey_FE(PermissionKey_DeveloperAdmin);
