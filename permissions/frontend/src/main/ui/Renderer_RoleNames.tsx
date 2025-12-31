import { LL_V_L } from "@nu-art/thunder-routing/index";
import { SessionKey_Permissions_FE } from '../consts.js';
export const Renderer_RoleNames = () => {
    const roles = SessionKey_Permissions_FE.get().roles;
    return <LL_V_L className={'container_role-names'}>
		{roles.map(roleName => <div className={'role-name'} id={roleName.key}>{roleName.uiLabel}</div>)}
	</LL_V_L>;
};
