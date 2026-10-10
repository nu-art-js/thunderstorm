import {expect} from 'chai';
import {i18nLocaleAccess, i18nLocaleGroupId, i18nLocaleGroupKey, i18nLocaleGroups, planLocaleAccess} from '../main/access-groups.js';

describe('i18n ACL: four groups per locale', () => {
	it('stable, distinct ids per locale and access key', () => {
		expect(i18nLocaleGroupId('nl', 'writers')).to.equal(i18nLocaleGroupId('nl', 'writers'));
		expect(i18nLocaleGroupId('nl', 'writers')).to.not.equal(i18nLocaleGroupId('de', 'writers'));
		expect(i18nLocaleGroupId('nl', 'writers')).to.not.equal(i18nLocaleGroupId('nl', 'readers'));
		expect(i18nLocaleGroupKey('nl', 'owners')).to.equal('i18n-locale--nl--owners');
	});

	it("a locale's documents carry only that locale's groups", () => {
		const access = i18nLocaleAccess('nl').__access;
		expect(Object.values(access).flat()).to.not.include(i18nLocaleGroupId('de', 'writers'));
		expect(access.creators).to.deep.equal(access.writers);
	});

	it('plan: all missing are created; a complete set is a no-op', () => {
		const plan = planLocaleAccess(['nl'], []);
		expect(plan.create).to.have.length(4);
		expect(planLocaleAccess(['nl'], i18nLocaleGroups('nl'))).to.deep.equal({create: [], update: []});
	});
});
