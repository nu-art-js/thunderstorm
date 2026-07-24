/*
 * @nu-art/firebase-backend — MongoInterface / FirestoreInterface query compile tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ImplementationMissingException} from '@nu-art/ts-common';
import {FirestoreInterface} from '../main/firestore/FirestoreInterface.js';
import {MongoInterface} from '../main/firestore/MongoInterface.js';

type DemoDoc = {
	_id: string
	active: boolean
	_path: string
	label: string
};

describe('MongoInterface.buildQuery — $regex / $or', () => {
	it('compiles RegExp to $regex + $options siblings', () => {
		const compiled = MongoInterface.buildQuery<DemoDoc>({
			where: {label: {$regex: /smoke/i}},
		});
		expect(compiled.filter).to.deep.equal({
			label: {$regex: 'smoke', $options: 'i'},
		});
	});

	it('omits $options when RegExp has no flags', () => {
		const compiled = MongoInterface.buildQuery<DemoDoc>({
			where: {_path: {$regex: /exact/}},
		});
		expect(compiled.filter).to.deep.equal({
			_path: {$regex: 'exact'},
		});
	});

	it('ANDs field predicates with $or groups', () => {
		const pattern = /knowledge/i;
		const compiled = MongoInterface.buildQuery<DemoDoc>({
			where: {
				active: true,
				$or: [
					{_path: {$regex: pattern}},
					{label: {$regex: pattern}},
				],
			},
		});
		expect(compiled.filter).to.deep.equal({
			active: true,
			$or: [
				{_path: {$regex: 'knowledge', $options: 'i'}},
				{label: {$regex: 'knowledge', $options: 'i'}},
			],
		});
	});
});

describe('FirestoreInterface.buildQuery — $regex / $or fail-fast', () => {
	const collection = {collection: {}} as any;

	it('throws on $or', () => {
		expect(() => FirestoreInterface.buildQuery(collection, {
			where: {$or: [{label: 'x'}]},
		})).to.throw(ImplementationMissingException, /\$or/);
	});

	it('throws on $regex', () => {
		expect(() => FirestoreInterface.buildQuery(collection, {
			where: {label: {$regex: /x/i}},
		})).to.throw(ImplementationMissingException, /\$regex/);
	});
});
