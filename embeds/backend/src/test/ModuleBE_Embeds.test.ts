import {expect} from 'chai';
import type {EmbedSubjectState} from '@nu-art/embeds-shared';
import {signHs256} from '../main/hs256.js';
import {ModuleBE_Embeds_Class} from '../main/ModuleBE_Embeds.js';

const Key = 'k'.repeat(40);

class TestEmbeds_Class
	extends ModuleBE_Embeds_Class {
	keyReads = 0;
	subjects: Record<string, EmbedSubjectState> = {page1: {origins: ['https://a.nl', 'https://b.nl'], version: 2}};

	constructor() {
		super();
		this.setSubjectResolver(async subject => this.subjects[subject]);
	}

	protected async loadSigningKey() {
		this.keyReads++;
		return Key;
	}
}

const rejects = (promise: Promise<unknown>) => promise.then(() => 'ok', (e: { responseCode?: number }) => e.responseCode ?? 'error');

describe('ModuleBE_Embeds - tokens', () => {
	it('round-trips a token, reading the key lazily once', async () => {
		const embeds = new TestEmbeds_Class();
		expect(embeds.keyReads).to.equal(0);
		const {token, claims} = await embeds.createToken({subject: 'page1', origins: ['https://a.nl'], version: 2});
		expect(await embeds.verifyToken(token)).to.deep.equal(claims);
		expect(embeds.keyReads).to.equal(1);
	});

	it('validates origins when issuing', async () => {
		const embeds = new TestEmbeds_Class();
		expect(await rejects(embeds.createToken({subject: 'page1', origins: ['http://a.nl'], version: 2}))).to.equal(400);
		expect(await rejects(embeds.createToken({subject: '', origins: [], version: 2}))).to.equal(400);
	});

	it('rejects tampered, foreign-key, non-embed, malformed and expired tokens', async () => {
		const embeds = new TestEmbeds_Class();
		const {token, claims} = await embeds.createToken({subject: 'page1', origins: ['https://a.nl'], version: 2, now: 1_000_000});
		const [h, , s] = token.split('.');
		const forgedBody = Buffer.from(JSON.stringify({...claims, subject: 'page2'})).toString('base64url');
		const cases = [
			`${h}.${forgedBody}.${s}`,
			signHs256({...claims}, 'x'.repeat(40)),
			signHs256({...claims, purpose: 'session'}, Key),
			signHs256({...claims, origins: 'https://a.nl'}, Key),
			'not.a.token',
			'',
		];
		for (const bad of cases)
			expect(await rejects(embeds.verifyToken(bad, 1_000_000_000)), bad).to.equal(401);

		expect(await rejects(embeds.verifyToken(token, (claims.exp + 1) * 1000))).to.equal(401);
	});
});

describe('ModuleBE_Embeds - frame authorization', () => {
	it('returns the still-allowed origins and frame-ancestors', async () => {
		const embeds = new TestEmbeds_Class();
		const {token} = await embeds.createToken({subject: 'page1', origins: ['https://a.nl', 'https://c.nl'], version: 2});
		const auth = await embeds.authorizeFrame(token);
		expect(auth.origins).to.deep.equal(['https://a.nl']);
		expect(auth.frameAncestors).to.equal('frame-ancestors \'self\' https://a.nl');
	});

	it('a version bump revokes; an unknown subject is refused', async () => {
		const embeds = new TestEmbeds_Class();
		const {token} = await embeds.createToken({subject: 'page1', origins: ['https://a.nl'], version: 2});
		embeds.subjects.page1 = {...embeds.subjects.page1, version: 3};
		expect(await rejects(embeds.authorizeFrame(token))).to.equal(401);
		delete embeds.subjects.page1;
		expect(await rejects(embeds.authorizeFrame(token))).to.equal(401);
	});

	it('no remaining origin is forbidden', async () => {
		const embeds = new TestEmbeds_Class();
		const {token} = await embeds.createToken({subject: 'page1', origins: ['https://c.nl'], version: 2});
		expect(await rejects(embeds.authorizeFrame(token))).to.equal(403);
	});

	it('serves a loader for its config', () => {
		const embeds = new TestEmbeds_Class();
		expect(embeds.loaderJs()).to.contain('"framePath":"/embed/frame"');
	});
});
