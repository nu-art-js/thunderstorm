import {expect} from 'chai';
import {ModuleFE_IdeWorkspace} from '../main/_module/ModuleFE_IdeWorkspace/ModuleFE_IdeWorkspace.js';
import {IDE_WORKSPACE_SCHEMA_VERSION} from '@nu-art/ide-workspace-shared';

describe('ModuleFE_IdeWorkspace scaffold', () => {
	it('exposes default layout with schema version 1', () => {
		const layout = ModuleFE_IdeWorkspace.layout.get();
		expect(layout.schemaVersion).to.equal(IDE_WORKSPACE_SCHEMA_VERSION);
		expect(layout.editor.type).to.equal('leaf');
	});
});
