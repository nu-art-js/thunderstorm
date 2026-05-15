import {currentTimeMillis, generateHex, JwtTools} from '@nu-art/ts-common';
import {stormTester} from '@nu-art/storm-testalot';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';
import {expect} from 'chai';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {DefaultStormTestConfig_Session, ModuleDummy_AccountsUser} from '../utils/helpers.js';
import {BaseSessionClaims, ModuleBE_SessionDB} from '../_main.js';
import {DatabaseDef_Account, DB_Session} from '@nu-art/user-account-shared';

const initialClaims: BaseSessionClaims = {
	accountId: stringToUniqueId<DatabaseDef_Account['dbKey']>(generateHex(32)),
	label: 'refresh-test',
	deviceId: generateHex(32)
};

const StormTestConfig_User = {
	...DefaultStormTestConfig_Session,
	modules: [...DefaultStormTestConfig_Session.modules, ModuleDummy_AccountsUser],
};

const testSessionRefreshed = async (check: (session: DB_Session) => Promise<DB_Session>) => {
	const session1 = await ModuleBE_SessionDB._session.create({initialClaims});
	const jwt1 = session1.sessionIdJwt;

	expect(session1._id).to.deep.equal(session1.validSessionJwtMd5s[0]);
	expect(session1.validSessionJwtMd5s).to.deep.equal([session1._id]);

	const {iat: iat1, exp: exp1, ...claims1} = await JwtTools.decode(jwt1);
	const halfwayTime = ((exp1 - iat1) * 1000 * 0.6) + currentTimeMillis(); // convert seconds to ms

	TimeProxy.setVirtualTime(halfwayTime);

	const session2 = await check(session1);
	const jwt2 = session2?.sessionIdJwt;

	expect(jwt1 !== jwt2).to.deep.equal(true);

	const {iat: iat2, exp: exp2, ...claims2} = await JwtTools.decode(jwt2);

	expect(iat2).to.be.greaterThan(iat1);
	expect(exp2).to.be.greaterThan(exp1);

	expect(claims1).to.deep.equal(claims2);

	expect(session2._id).to.deep.equal(session2.validSessionJwtMd5s[0]);
	expect(session2.validSessionJwtMd5s).to.deep.equal([session2._id, session1._id]);

	const allSessions = await ModuleBE_SessionDB.query.where({});
	expect(allSessions.length).to.deep.equal(1);
};

describe('Refresh JWT Token', () => {
	it('Session Refresh by Session', async () => {
		await stormTester(StormTestConfig_User,
			async () => {
				return testSessionRefreshed(async (session) => await ModuleBE_SessionDB._session.rotate.refreshIfNeeded.bySession(session));
			});
	});

	it('Session Refresh by JWT', async () => {
		await stormTester(StormTestConfig_User,
			async () => {
				return testSessionRefreshed(async (session) => (await ModuleBE_SessionDB._session.rotate.refreshIfNeeded.byJwt(session.sessionIdJwt))!);
			});
	});
});

const testExpiredSession = async (check: (session: DB_Session) => Promise<void>) => {
	const session = await ModuleBE_SessionDB._session.create({initialClaims});
	const jwt = session.sessionIdJwt;

	const {exp} = await JwtTools.decode(jwt);
	TimeProxy.setVirtualTime((exp + 1) * 1000);

	await check(session);
};

describe('Session Expiration Cases', () => {
	it('No refresh needed before rotation threshold by JWT', async () => {
		await stormTester(StormTestConfig_User, async () => {
			const session = await ModuleBE_SessionDB._session.create({initialClaims});
			const jwt = session.sessionIdJwt;

			const newSession = await ModuleBE_SessionDB._session.rotate.refreshIfNeeded.byJwt(jwt);
			expect(newSession).to.equal(undefined);
		});
	});

	it('No refresh needed before rotation threshold by dbSession', async () => {
		await stormTester(StormTestConfig_User, async () => {
			const session = await ModuleBE_SessionDB._session.create({initialClaims});
			const newSession = await ModuleBE_SessionDB._session.rotate.refreshIfNeeded.bySession(session);
			expect(newSession).to.deep.equal(session);
		});
	});

	it('MUST fail trying to refresh expired JWT - by JWT', async () => {
		await stormTester(StormTestConfig_User, async () => {
			await testExpiredSession(async (session) => {
				expect(ModuleBE_SessionDB._session.rotate.refreshIfNeeded.byJwt(session.sessionIdJwt)).to.be.rejectedWith('JWT is expired');
			});
		});
	});

	it('MUST fail trying to refresh expired JWT - by dbSession', async () => {
		await stormTester(StormTestConfig_User, async () => {
			await testExpiredSession(async (session) => {
				expect(ModuleBE_SessionDB._session.rotate.refreshIfNeeded.bySession(session)).to.be.rejectedWith('JWT is expired');
			});
		});
	});
});
