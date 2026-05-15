import {FileTransferState, TransferDirection, FileTransferPhase} from '../main/modules/ModuleFE_FileUpload.js';


describe('FileTransferState types', () => {
	it('Upload state has correct direction', () => {
		const state: FileTransferState = {
			name: 'test.jpg',
			progress: 0,
			phase: 'requesting',
			direction: 'upload',
		};
		if (state.direction !== 'upload')
			throw new Error(`Expected "upload", got "${state.direction}"`);
	});

	it('Download state has correct direction', () => {
		const state: FileTransferState = {
			name: 'report.pdf',
			progress: 0.5,
			phase: 'downloading',
			direction: 'download',
		};
		if (state.direction !== 'download')
			throw new Error(`Expected "download", got "${state.direction}"`);
	});

	it('All upload phases are valid', () => {
		const uploadPhases: FileTransferPhase[] = ['requesting', 'uploading', 'confirming', 'completed', 'failed'];
		for (const phase of uploadPhases) {
			const state: FileTransferState = {
				name: 'test.jpg',
				progress: 0,
				phase,
				direction: 'upload',
			};
			if (state.phase !== phase)
				throw new Error(`Phase mismatch: expected "${phase}", got "${state.phase}"`);
		}
	});

	it('All download phases are valid', () => {
		const downloadPhases: FileTransferPhase[] = ['requesting', 'preparing', 'downloading', 'completed', 'failed'];
		for (const phase of downloadPhases) {
			const state: FileTransferState = {
				name: 'report.pdf',
				progress: 0,
				phase,
				direction: 'download',
			};
			if (state.phase !== phase)
				throw new Error(`Phase mismatch: expected "${phase}", got "${state.phase}"`);
		}
	});

	it('Failed state includes error message', () => {
		const state: FileTransferState = {
			name: 'broken.zip',
			progress: 0.3,
			phase: 'failed',
			direction: 'upload',
			error: 'MIME type mismatch',
		};
		if (!state.error)
			throw new Error('Expected error field to be populated');
	});

	it('Completed state has progress 1', () => {
		const state: FileTransferState = {
			name: 'done.jpg',
			progress: 1,
			phase: 'completed',
			direction: 'upload',
		};
		if (state.progress !== 1)
			throw new Error(`Expected progress 1, got ${state.progress}`);
	});

	it('Direction type exhausts upload and download', () => {
		const directions: TransferDirection[] = ['upload', 'download'];
		if (directions.length !== 2)
			throw new Error(`Expected 2 directions, got ${directions.length}`);
	});
});
