import {expect} from 'chai';
import {I18nAdminGroupId, i18nOverrideWriterIds, i18nTranslatorGroupId, i18nTranslatorGroupKey} from '../main/access-groups.js';

describe('i18n ACL buckets', () => {
	it('one translator group per locale, with a stable id', () => {
		expect(i18nTranslatorGroupKey('nl')).to.equal('i18n-translator--nl');
		expect(i18nTranslatorGroupId('nl')).to.equal(i18nTranslatorGroupId('nl'));
		expect(i18nTranslatorGroupId('nl')).to.not.equal(i18nTranslatorGroupId('de'));
	});

	it("a locale's overrides are writable by that locale's group and the admins only", () => {
		expect(i18nOverrideWriterIds('nl')).to.deep.equal([i18nTranslatorGroupId('nl'), I18nAdminGroupId]);
		expect(i18nOverrideWriterIds('nl')).to.not.include(i18nTranslatorGroupId('de'));
	});
});
