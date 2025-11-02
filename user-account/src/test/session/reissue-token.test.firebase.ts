import {currentTimeMillis, generateHex, JwtTools} from '@nu-art/ts-common';
import {BaseSessionClaims, ModuleBE_SessionDB} from '../../main/_entity/session/backend/index.js';
import {stormTester, StormTestInput} from '@nu-art/thunderstorm/backend/test/StormTest';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';
import {expect} from 'chai';
import {DB_Session} from '../../main/index.js';
import {DefaultStormTestConfig_Session, ModuleDummy_AccountsUser, ModuleDummy_Claims} from '../utils/helpers.js';


const initialClaims: BaseSessionClaims = {
	accountId: generateHex(32),
	label: 'reissue-test',
	deviceId: generateHex(32)
};


const DefaultStormTest_WithClaims: StormTestInput = {
	...DefaultStormTestConfig_Session,
	modules: [
		...DefaultStormTestConfig_Session.modules,
		ModuleDummy_AccountsUser,
		ModuleDummy_Claims
	],
};


const testSessionReissued = async (check: (session: DB_Session) => Promise<DB_Session>) => {
	ModuleDummy_Claims.value = '8888';
	const session1 = await ModuleBE_SessionDB._session.create({initialClaims});
	const jwt1 = session1.sessionIdJwt;

	expect(session1._id).to.deep.equal(session1.validSessionJwtMd5s[0]);
	expect(session1.validSessionJwtMd5s).to.deep.equal([session1._id]);
	const {iat: iat1, exp: exp1, label: label1, ...claims1} = await JwtTools.decode(jwt1);

	//because time-wise this test runs in less than a sec the iat2 equals to iat1.. adding 10 sec
	TimeProxy.setVirtualTime(currentTimeMillis() + 10000);

	ModuleDummy_Claims.value = '9999';
	const session2 = await check(session1);
	const jwt2 = session2.sessionIdJwt;

	expect(jwt1 !== jwt2).to.equal(true);
	const {iat: iat2, exp: exp2, label: label2, ...claims2} = await JwtTools.decode(jwt2);

	expect(iat2).to.be.greaterThan(iat1);
	expect(exp2).to.be.greaterThan(exp1);

	console.log('claims1: ', claims1, 'claims2: ', claims2);

	expect(label1).to.deep.equal(initialClaims.label);
	expect(label2).to.deep.equal(`reissued from ${session1._id}`);
	expect((claims1 as any).custom?.['value']).to.deep.equal('8888');
	expect((claims2 as any).custom?.['value']).to.deep.equal('9999');
	delete (claims1 as any).custom?.['value'];
	delete (claims2 as any).custom?.['value'];
	expect(claims1).to.deep.equal(claims2);

	expect(session2._id).to.deep.equal(session2.validSessionJwtMd5s[0]);
	expect(session2.validSessionJwtMd5s).to.deep.equal([session2._id, session1._id]);

	const allSessions = await ModuleBE_SessionDB.query.where({});
	expect(allSessions.length).to.equal(2);
};

describe('Reissue JWT Token', () => {
	it('Session Reissue by dbSession', async () => {
		await stormTester(DefaultStormTest_WithClaims,
			async () => {
				return testSessionReissued(async (session) => await ModuleBE_SessionDB._session.rotate.reissue.bySession(session));
			});
	});

	it('Session Reissue by JWT', async () => {
		await stormTester(DefaultStormTest_WithClaims,
			async () => {
				return testSessionReissued(async (session) => (await ModuleBE_SessionDB._session.rotate.reissue.byJwt(session.sessionIdJwt))!);
			});
	});
});
