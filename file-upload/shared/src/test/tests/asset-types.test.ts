import {AssetStatus} from '../../main/types.js';


describe('AssetStatus enum', () => {
	it('Has Pending value', () => {
		if (AssetStatus.Pending !== 'pending')
			throw new Error(`Expected "pending", got "${AssetStatus.Pending}"`);
	});

	it('Has Validated value', () => {
		if (AssetStatus.Validated !== 'validated')
			throw new Error(`Expected "validated", got "${AssetStatus.Validated}"`);
	});

	it('Has Failed value', () => {
		if (AssetStatus.Failed !== 'failed')
			throw new Error(`Expected "failed", got "${AssetStatus.Failed}"`);
	});

	it('Has exactly 3 values', () => {
		const values = Object.values(AssetStatus);
		if (values.length !== 3)
			throw new Error(`Expected 3 values, got ${values.length}: ${values.join(', ')}`);
	});
});
