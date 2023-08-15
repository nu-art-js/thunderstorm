import {dbObjectToId, flatArray, Module, PreDB} from '@nu-art/ts-common';
import {addRoutes, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {ApiDef_Permissions, DB_PermissionGroup, DB_PermissionProject, DB_PermissionUser} from '../../shared';
import {ModuleBE_PermissionProject} from './management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from './management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from './management/ModuleBE_PermissionAccessLevel';
import {defaultAccessLevels} from '../../shared/management/access-level/consts';
import {defaultDomains} from '../../shared/management/domain/consts';
import {ModuleBE_PermissionGroup} from './assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionUserDB} from './assignment/ModuleBE_PermissionUserDB';
import {MemKey_AccountId} from '@nu-art/user-account/backend';


class ModuleBE_Permissions_Class
	extends Module {

	protected init() {
		super.init();

		addRoutes([
			createQueryServerApi(ApiDef_Permissions.v1.createProject, this.createProject)
		]);
	}

	createProject = async () => {
		//Create New Project
		const project = await ModuleBE_PermissionProject.create.item({name: 'New Project'} as PreDB<DB_PermissionProject>);

		//Create initial domains
		const domains = await ModuleBE_PermissionDomain.create.all(defaultDomains.map(i => ({...i, projectId: project._id})));

		//Create initial access levels
		const levels = await ModuleBE_PermissionAccessLevel.create.all(flatArray(domains.map(domain => {
			return defaultAccessLevels.map(level => ({...level, domainId: domain._id}));
		})));

		//Create super-admin permission group
		const group = await ModuleBE_PermissionGroup.create.item({
			label: 'Super Admin',
			accessLevelIds: levels.filter(i => i.name === 'Admin').map(dbObjectToId)
		} as PreDB<DB_PermissionGroup>);

		const triggeringAccountId = MemKey_AccountId.get();

		const user = await ModuleBE_PermissionUserDB.create.item({
				accountId: triggeringAccountId,
				groups: [{groupId: group._id}]
			} as PreDB<DB_PermissionUser>
		);

		this.logInfo(user);
	};
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();