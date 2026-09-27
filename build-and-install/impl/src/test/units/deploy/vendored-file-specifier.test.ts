import {expect} from 'chai';
import {resolve} from 'path';
import {vendoredFileSpecifier} from '../../../main/units/implementations/firebase/vendored-file-specifier.js';

describe('vendoredFileSpecifier', () => {
	const root = resolve('/workspace/dist/.dependencies');

	it('cross-scope: @app/foo → @nu-art/bar goes up out of @app', () => {
		expect(vendoredFileSpecifier(resolve(root, '@app/organization-backend'), '@nu-art/passkey-backend', root))
			.to.equal('file:../../@nu-art/passkey-backend');
	});

	it('same-scope: @nu-art/foo → @nu-art/bar is a sibling name', () => {
		expect(vendoredFileSpecifier(resolve(root, '@nu-art/passkey-backend'), '@nu-art/passkey-shared', root))
			.to.equal('file:../passkey-shared');
	});

	it('unscoped siblings stay one level up', () => {
		expect(vendoredFileSpecifier(resolve(root, 'lib-a'), 'lib-b', root))
			.to.equal('file:../lib-b');
	});
});
