import {defaultValueResolverV2, PermissionKey_BE} from '../PermissionKey_BE';
import {Domain_Developer} from '../permissions';
import {DefaultAccessLevel_Read} from '../../shared/consts';


export const PermissionKeyBE_DeveloperAdmin = new PermissionKey_BE('permission-key--developer-admin', () => defaultValueResolverV2(Domain_Developer._id, DefaultAccessLevel_Read.name));
