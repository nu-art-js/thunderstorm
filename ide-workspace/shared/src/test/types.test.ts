import {expect} from 'chai';
import {IDE_WORKSPACE_SCHEMA_VERSION, type WorkspaceState} from '../main/types.js';

describe('ide-workspace shared types', () => {
	it('schema version is locked at 1', () => {
		expect(IDE_WORKSPACE_SCHEMA_VERSION).to.equal(1);
	});

	it('WorkspaceState accepts minimal serializable layout', () => {
		const state: WorkspaceState = {
			schemaVersion: IDE_WORKSPACE_SCHEMA_VERSION,
			panels: [],
			editor: {type: 'leaf', id: 'pane-1', tabs: []},
		};
		expect(state.editor.type).to.equal('leaf');
	});
});
