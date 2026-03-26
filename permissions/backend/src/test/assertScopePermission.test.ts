/*
 * @nu-art/permissions-backend - Pure unit tests for assertScopePermission
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {definePermissionScope} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionsAssert} from '../main/modules/ModuleBE_PermissionsAssert.js';
import {MemKey_UserScopePermissions} from '../main/consts.js';

const Scope_Topics = definePermissionScope('topics', ['read', 'write', 'admin'] as const);
const Scope_Ingest = definePermissionScope('ingest', ['read', 'write', 'admin'] as const);
const Scope_Alerting = definePermissionScope('alerting', ['read', 'write', 'admin'] as const);
const Scope_Pipeline = definePermissionScope('pipeline', ['read', 'write', 'admin'] as const);
const Scope_Nested = definePermissionScope('myorg:topics', ['read', 'write', 'admin'] as const);

const editorialEntries = ['topics:write', 'ingest:write', 'alerting:read', 'pipeline:read'];
const engineeringEntries = ['pipeline:write', 'alerting:admin', 'topics:read', 'ingest:read'];
const bothGroupsMax = ['topics:write', 'ingest:write', 'alerting:admin', 'pipeline:write'];

describe('assertScopePermission', () => {

	it('passes when user has exact required value', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['topics:write']);
			ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'write');
		});
	});

	it('passes when user has higher value than required', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['topics:admin']);
			ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'write');
		});
	});

	it('rejects when user has lower value than required', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['topics:read']);
			try {
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'write');
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('rejects when scope is missing from user permissions', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['ingest:admin']);
			try {
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'read');
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('rejects when scope entries array is empty', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set([]);
			try {
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'read');
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('throws 503 for unknown required value', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['topics:admin']);
			try {
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'superadmin' as any);
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(503);
			}
		});
	});

	describe('nested scope keys', () => {
		it('asserts correctly with nested scope key', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['myorg:topics:write']);
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Nested, 'write');
			});
		});

		it('higher level passes nested scope assertion', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['myorg:topics:admin']);
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Nested, 'read');
			});
		});

		it('lower level rejected for nested scope', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['myorg:topics:read']);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Nested, 'write');
					expect.fail('Should have thrown');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});

		it('does not confuse nested key with flat key prefix', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['topics:admin']);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Nested, 'read');
					expect.fail('Should have thrown — topics:admin should not match myorg:topics scope');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});
	});

	describe('Editorial group scenario', () => {
		it('Editorial can write topics', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(editorialEntries);
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'write');
			});
		});

		it('Editorial can write to ingest (news sources)', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(editorialEntries);
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Ingest, 'write');
			});
		});

		it('Editorial is denied alerting write (only has read)', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(editorialEntries);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Alerting, 'write');
					expect.fail('Should have thrown');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});

		it('Editorial is denied alerting admin', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(editorialEntries);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Alerting, 'admin');
					expect.fail('Should have thrown');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});

		it('Editorial is denied pipeline write (only has read)', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(editorialEntries);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Pipeline, 'write');
					expect.fail('Should have thrown');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});
	});

	describe('Engineering group scenario', () => {
		it('Engineering can write to pipeline', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(engineeringEntries);
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Pipeline, 'write');
			});
		});

		it('Engineering has alerting admin', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(engineeringEntries);
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Alerting, 'admin');
			});
		});

		it('Engineering is denied topic write (only has read)', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(engineeringEntries);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'write');
					expect.fail('Should have thrown');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});

		it('Engineering is denied ingest write (only has read)', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(engineeringEntries);
				try {
					ModuleBE_PermissionsAssert.assertScopePermission(Scope_Ingest, 'write');
					expect.fail('Should have thrown');
				} catch (e: any) {
					expect(e.responseCode).to.equal(403);
				}
			});
		});
	});

	describe('Both groups combined (max per scope)', () => {
		it('user in both groups gets max value per scope', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(bothGroupsMax);

				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Topics, 'write');
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Ingest, 'write');
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Alerting, 'admin');
				ModuleBE_PermissionsAssert.assertScopePermission(Scope_Pipeline, 'write');
			});
		});
	});
});
