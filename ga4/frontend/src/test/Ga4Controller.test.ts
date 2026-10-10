/*
 * @nu-art/ga4-frontend - Consent-gated Google Analytics 4 for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ConsentStore, DefaultConsentCategories} from '@nu-art/consent-shared';
import {Ga4Controller, type Ga4Environment} from '../main/Ga4Controller.js';

type FakeEnv = Ga4Environment & { scripts: string[]; deleted: string[][] };

const createEnv = (): FakeEnv => {
	const env: FakeEnv = {
		global: {},
		scripts: [],
		deleted: [],
		loadScript: src => void env.scripts.push(src),
		deleteCookies: prefixes => void env.deleted.push(prefixes),
	};
	return env;
};

const calls = (env: FakeEnv) => (env.global.dataLayer ?? []).map(entry => Array.from(entry as ArrayLike<unknown>));
const consentUpdates = (env: FakeEnv) => calls(env).filter(c => c[0] === 'consent' && c[1] === 'update').map(c => c[2]);

let consent: ConsentStore;
let env: FakeEnv;
const create = () => new Ga4Controller({
	measurementId: 'G-TEST',
	consent,
	analyticsCategory: 'analytics',
	marketingCategory: 'marketing',
	sendPageView: false,
	scriptUrl: 'https://www.googletagmanager.com/gtag/js',
	env,
});

describe('ga4 - Ga4Controller', () => {
	beforeEach(() => {
		consent = new ConsentStore({categories: DefaultConsentCategories, policyVersion: 1, maxAgeMs: 1e12, storageKey: 'c'});
		env = createEnv();
	});

	it('loads nothing and touches no globals before consent', () => {
		const ga = create();
		ga.start();
		expect(ga.event('click')).to.equal(false);
		expect(env.scripts).to.deep.equal([]);
		expect(env.global).to.deep.equal({});
	});

	it('loads nothing when the visitor rejects', () => {
		const ga = create();
		ga.start();
		consent.rejectAll();
		expect(env.scripts).to.deep.equal([]);
		expect(env.global).to.deep.equal({});
	});

	it('loads gtag once analytics is granted, with ad signals denied unless marketing is granted', () => {
		const ga = create();
		ga.start();
		consent.decide({analytics: true});
		expect(env.scripts).to.deep.equal(['https://www.googletagmanager.com/gtag/js?id=G-TEST']);
		const all = calls(env);
		expect(all[0]).to.deep.equal(['consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'}]);
		expect(all[1]).to.deep.equal(['consent', 'update', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'}]);
		expect(all.find(c => c[0] === 'config')).to.deep.equal(['config', 'G-TEST', {send_page_view: false}]);
		expect(ga.event('click', {id: 1})).to.equal(true);
		expect(calls(env).at(-1)).to.deep.equal(['event', 'click', {id: 1}]);
	});

	it('starts immediately when consent was already given', () => {
		consent.acceptAll();
		create().start();
		expect(env.scripts).to.have.length(1);
		expect(consentUpdates(env).at(-1)).to.deep.include({ad_storage: 'granted'});
	});

	it('follows a marketing change while enabled', () => {
		create().start();
		consent.decide({analytics: true});
		consent.decide({analytics: true, marketing: true});
		expect(consentUpdates(env).at(-1)).to.deep.equal({analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted'});
	});

	it('on withdrawal: denies, sets the opt-out flag, deletes _ga cookies and drops events', () => {
		const ga = create();
		ga.start();
		consent.acceptAll();
		consent.withdraw();
		expect(consentUpdates(env).at(-1)).to.deep.include({analytics_storage: 'denied'});
		expect(env.global['ga-disable-G-TEST']).to.equal(true);
		expect(env.deleted).to.deep.equal([['_ga']]);
		expect(ga.pageView()).to.equal(false);
	});

	it('re-granting does not load the script twice and clears the opt-out flag', () => {
		create().start();
		consent.acceptAll();
		consent.withdraw();
		consent.acceptAll();
		expect(env.scripts).to.have.length(1);
		expect(env.global['ga-disable-G-TEST']).to.equal(false);
	});

	it('stop() unsubscribes from consent', () => {
		const ga = create();
		ga.start();
		ga.stop();
		consent.acceptAll();
		expect(env.scripts).to.deep.equal([]);
	});
});
