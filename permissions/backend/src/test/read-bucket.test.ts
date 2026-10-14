import {expect} from 'chai';
import {GroupId_ReadBucket} from '@nu-art/permissions-shared';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {ModuleBE_AccessGroupDB} from '../main/_entity/access-group/ModuleBE_AccessGroupDB.js';
import {GroupId_BootstrapServiceAccount, GroupId_PermissionsAdmin, ModuleBE_Permissions, ServiceAccountId_Bootstrap} from '../main/index.js';

type Resolver = (item: { _id: string }) => { __access: Record<string, string[]> };

describe('Read bucket', () => {
	const resolve = (ModuleBE_Permissions as unknown as { permissionsAccessResolver: Resolver }).permissionsAccessResolver;

	it('only the bootstrap system service account writes it', () => {
		const access = resolve({_id: GroupId_ReadBucket}).__access;
		expect(access.writers).to.deep.equal([GroupId_BootstrapServiceAccount]);
		expect(access.owners).to.deep.equal([]);
		expect(access.deleters).to.deep.equal([]);
		expect(access.creators).to.deep.equal([]);
	});

	it('permissions admins can still write ordinary groups', () => {
		expect(resolve({_id: 'some-group'}).__access.writers).to.deep.equal([GroupId_PermissionsAdmin]);
	});

	it('a new account joins the group on registration, as the bootstrap service account', async () => {
		const mod = ModuleBE_Permissions as any;
		const groups = ModuleBE_AccessGroupDB as any;
		const original = {run: mod.runAsServiceAccount, personal: mod.ensurePersonalAccessGroup, query: groups.query, set: groups.set};
		const ranAs: string[] = [];
		const group = {_id: GroupId_ReadBucket, members: [] as string[]};
		const written: unknown[] = [];
		mod.runAsServiceAccount = async (id: string, action: () => Promise<unknown>) => {
			ranAs.push(id);
			return action();
		};
		mod.ensurePersonalAccessGroup = async () => undefined;
		groups.query = {unique: async (id: string) => id === GroupId_ReadBucket ? group : undefined};
		groups.set = {item: async (item: unknown) => written.push(item)};
		try {
			await ModuleBE_Permissions.__onNewUserRegistered({_id: 'account-1'} as never);
			await ModuleBE_Permissions.__onNewUserRegistered({_id: 'account-1'} as never);
		} finally {
			mod.runAsServiceAccount = original.run;
			mod.ensurePersonalAccessGroup = original.personal;
			groups.query = original.query;
			groups.set = original.set;
		}

		expect(ranAs).to.deep.equal([ServiceAccountId_Bootstrap, ServiceAccountId_Bootstrap]);
		expect(group.members).to.deep.equal([stringToUniqueId('account-1')]);
		expect(written.length).to.equal(1);
	});
});
