/*
 * @nu-art/action-processor-backend - Tests for ModuleBE_ActionProcessor
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException, BadImplementationException, Dispatcher} from '@nu-art/ts-common';
import {ModuleBE_ActionProcessor} from '../main/ModuleBE_ActionProcessor.js';
import {RAD_SetupProject} from '../main/Action_SetupProject.js';

describe('ModuleBE_ActionProcessor', () => {
	describe('registerAction', () => {
		it('throws BadImplementationException when same key is registered twice', () => {
			try {
				ModuleBE_ActionProcessor.registerAction(RAD_SetupProject, ModuleBE_ActionProcessor);
				expect.fail('expected BadImplementationException');
			} catch (e) {
				expect(e).to.be.instanceOf(BadImplementationException);
				expect((e as Error).message).to.include('setup-project');
				expect((e as Error).message).to.include('registered twice');
			}
		});
	});

	describe('list', () => {
		it('returns at least one registered action with setup-project', async () => {
			const actions = await ModuleBE_ActionProcessor.list();
			expect(actions).to.be.an('array');
			expect(actions.length).to.be.at.least(1);
			const setupProject = actions.find(a => a.key === 'setup-project');
			expect(setupProject).to.not.be.undefined;
			expect(setupProject).to.have.property('description');
			expect(setupProject).to.have.property('group');
			expect(setupProject!.group).to.equal('Initialization');
		});
	});

	describe('refactor', () => {
		it('throws ApiException 404 for unknown action key', async () => {
			try {
				await ModuleBE_ActionProcessor.refactor({key: 'nonexistent-key'});
				expect.fail('expected ApiException');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(404);
				expect((e as Error).message).to.include('NO SUCH ACTION');
				expect((e as Error).message).to.include('nonexistent-key');
			}
		});

		it('resolves when action key exists (setup-project)', async () => {
			const previous = Dispatcher.modulesResolver;
			try {
				Dispatcher.modulesResolver = () => [];
				await ModuleBE_ActionProcessor.refactor({key: 'setup-project'});
			} finally {
				Dispatcher.modulesResolver = previous;
			}
		});
	});
});
