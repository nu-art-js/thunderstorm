import {expect} from 'chai';
import {GroupId_ReadBucket} from '@nu-art/permissions-shared';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {projectSetupReaches as graphReaches, setProjectSetupRoots} from '@nu-art/action-processor-backend';
import {ModuleBE_AccessGroupDB} from '../main/_entity/access-group/ModuleBE_AccessGroupDB.js';
import {GroupId_BootstrapServiceAccount, GroupId_PermissionsAdmin, ModuleBE_Permissions, DispatchKey_PermissionsGroups, DispatchKey_PermissionsReadBucket, ServiceAccountId_Bootstrap} from '../main/index.js';

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

	type Harness = { ranAs: string[]; group: { _id: string; members: string[] }; written: unknown[] };

	/** Stubs the SA context and the group DB for one test, restoring them after. */
	const withStubs = async (test: (harness: Harness) => Promise<void>, failQuery = false) => {
		const mod = ModuleBE_Permissions as any;
		const groups = ModuleBE_AccessGroupDB as any;
		const original = {run: mod.runAsServiceAccount, query: groups.query, set: groups.set};
		const harness: Harness = {ranAs: [], group: {_id: GroupId_ReadBucket, members: []}, written: []};
		mod.runAsServiceAccount = async (id: string, action: () => Promise<unknown>) => {
			harness.ranAs.push(id);
			return action();
		};
		groups.query = {
			unique: async (id: string) => {
				if (failQuery)
					throw new Error('db down');
				return id === GroupId_ReadBucket ? harness.group : undefined;
			}
		};
		groups.set = {item: async (item: unknown) => harness.written.push(item)};
		try {
			await test(harness);
		} finally {
			mod.runAsServiceAccount = original.run;
			groups.query = original.query;
			groups.set = original.set;
			setProjectSetupRoots();
		}
	};

	it('the read-bucket action depends on the permission groups action', () => {
		setProjectSetupRoots(DispatchKey_PermissionsReadBucket);
		try {
			expect(graphReaches(DispatchKey_PermissionsGroups)).to.equal(true);
		} finally {
			setProjectSetupRoots();
		}
	});

	it('when the roots reach the read bucket, registration adds the account once, as the bootstrap SA', () => withStubs(async harness => {
		setProjectSetupRoots(DispatchKey_PermissionsReadBucket);
		await ModuleBE_Permissions.__onNewUserRegistered({_id: 'account-1'} as never);
		await ModuleBE_Permissions.__onNewUserRegistered({_id: 'account-1'} as never);
		expect(harness.ranAs).to.deep.equal([ServiceAccountId_Bootstrap, ServiceAccountId_Bootstrap]);
		expect(harness.group.members).to.deep.equal([stringToUniqueId('account-1')]);
		expect(harness.written.length).to.equal(1);
	}));

	it('when the roots do not reach the read bucket, registration does nothing (no read, no write)', () => withStubs(async harness => {
		setProjectSetupRoots(DispatchKey_PermissionsGroups);
		await ModuleBE_Permissions.__onNewUserRegistered({_id: 'account-1'} as never);
		expect(harness.ranAs).to.deep.equal([]);
		expect(harness.written).to.deep.equal([]);
	}));

	it('a read-bucket failure does not fail the registration', () => withStubs(async harness => {
		setProjectSetupRoots(DispatchKey_PermissionsReadBucket);
		await ModuleBE_Permissions.__onNewUserRegistered({_id: 'account-1'} as never);
		expect(harness.written).to.deep.equal([]);
	}, true));
});
