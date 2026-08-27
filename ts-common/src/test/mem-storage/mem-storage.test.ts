import {expect} from 'chai';
import {BadImplementationException} from '../../main/index.js';
import {MemKey, MemStorage} from '../../main/mem-storage/MemStorage.js';

const Key_User = new MemKey<string>('user');
const Key_Role = new MemKey<string>('role');
const Key_Unique = new MemKey<string>('unique', true);

describe('MemStorage parent chain', () => {
	it('nested init reads a value set in the parent context', async () => {
		await new MemStorage().init(async () => {
			Key_User.set('parent-user');

			await new MemStorage().init(async () => {
				expect(Key_User.peak()).to.equal('parent-user');
				expect(Key_User.get()).to.equal('parent-user');
			});
		});
	});

	it('child override shadows parent without mutating parent', async () => {
		await new MemStorage().init(async () => {
			Key_User.set('parent-user');

			await new MemStorage().init(async () => {
				Key_User.set('child-user');
				expect(Key_User.get()).to.equal('child-user');
			});

			expect(Key_User.get()).to.equal('parent-user');
		});
	});

	it('walks a three-level parent chain', async () => {
		await new MemStorage().init(async () => {
			Key_User.set('root');

			await new MemStorage().init(async () => {
				Key_Role.set('parent-role');

				await new MemStorage().init(async () => {
					expect(Key_User.get()).to.equal('root');
					expect(Key_Role.get()).to.equal('parent-role');
				});
			});
		});
	});

	it('explicit enclosingContextStorage links as parent', async () => {
		const parent = new MemStorage();
		await parent.init(async () => {
			Key_User.set('explicit-parent');

			const child = new MemStorage();
			await child.init(async () => {
				expect(Key_User.get()).to.equal('explicit-parent');
			}, parent);
		});
	});

	it('initSync nests with the same parent-chain reads', () => {
		new MemStorage().initSync(() => {
			Key_User.set('sync-parent');

			new MemStorage().initSync(() => {
				expect(Key_User.get()).to.equal('sync-parent');
			});
		});
	});

	it('unique keys can be overridden in a child context', async () => {
		await new MemStorage().init(async () => {
			Key_Unique.set('parent');

			await new MemStorage().init(async () => {
				Key_Unique.set('child');
				expect(Key_Unique.get()).to.equal('child');
			});

			expect(Key_Unique.get()).to.equal('parent');
		});
	});

	it('unique keys still reject double-set within the same context', async () => {
		await new MemStorage().init(async () => {
			Key_Unique.set('first');

			try {
				Key_Unique.set('second');
				expect.fail('expected unique-key override rejection');
			} catch (err) {
				expect(err).to.be.instanceOf(BadImplementationException);
			}
		});
	});

	it('simulates service-account nesting: parent set before child init is visible in child', async () => {
		const sessionOrganizationId = new MemKey<string>('session-organization-id');

		await new MemStorage().init(async () => {
			sessionOrganizationId.set('org-123');

			await new MemStorage().init(async () => {
				expect(sessionOrganizationId.peak()).to.equal('org-123');
			});
		});
	});

	it('returns undefined from peak when key is absent in the full chain', async () => {
		await new MemStorage().init(async () => {
			await new MemStorage().init(async () => {
				expect(Key_User.peak()).to.equal(undefined);
			});
		});
	});
});
