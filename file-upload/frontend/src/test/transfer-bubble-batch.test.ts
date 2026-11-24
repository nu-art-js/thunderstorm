import {register} from 'node:module';
import type {FileTransferState} from '../main/modules/ModuleFE_FileUpload.js';

// Register before the component import. The stylesheet import is a side effect and has no CSS runtime here.
register(new URL('./scss-stub-loader.mjs', import.meta.url).href, {
	parentURL: import.meta.url,
});

type Bubble = {
	state: {files: Map<string, FileTransferState>};
	autoHideTimer?: ReturnType<typeof setTimeout>;
	setState: (update: unknown) => void;
	__onFileTransferStateChanged: (fileState: FileTransferState) => void;
	getPhaseLabel: (phase: FileTransferState['phase']) => string;
};

type StateUpdate = Partial<Bubble['state']> | ((prev: Bubble['state']) => Partial<Bubble['state']>);

const Names = [
	'loader-1-tree.zip',
	'loader-5-book.zip',
	'loader-7-snowflake.zip',
	'loader-6-bulb.zip',
	'loader-3-hourglass.zip',
	'loader-2-sphere.zip',
	'loader-4-dna.zip',
];

const fileState = (name: string, phase: FileTransferState['phase']): FileTransferState => ({
	transferId: name,
	assetId: name,
	name,
	progress: 1,
	phase,
	direction: 'upload',
});

// React 18 keeps this.state stale for the whole burst, then applies the queued updates in order.
// An object update already closed over the stale map. A function update receives the pending state.
const flush = (state: Bubble['state'], queued: StateUpdate[]): Bubble['state'] => {
	let next = state;
	for (const update of queued) {
		const partial = typeof update === 'function' ? update(next) : update;
		next = {...next, ...partial};
	}
	return next;
};

describe('TransferBubble confirm burst', () => {
	it('shows Done for every file when seven confirms finish in one burst', async () => {
		const {TransferBubble} = await import('../main/ui/TransferBubble/TransferBubble.js');
		const bubble = new TransferBubble({}) as unknown as Bubble;
		const queued: StateUpdate[] = [];
		bubble.setState = (update: unknown) => {
			queued.push(update as StateUpdate);
		};

		// Uploads finish apart, so each Validating row is committed before the next one.
		for (const name of Names) {
			queued.length = 0;
			bubble.__onFileTransferStateChanged(fileState(name, 'confirming'));
			bubble.state = flush(bubble.state, queued);
		}

		// Confirms return together. The screen must leave Validating for every row.
		queued.length = 0;
		for (const name of Names)
			bubble.__onFileTransferStateChanged(fileState(name, 'completed'));
		bubble.state = flush(bubble.state, queued);

		const stuck = [...bubble.state.files.values()]
			.filter(file => bubble.getPhaseLabel(file.phase) !== 'Done')
			.map(file => `${file.name} ${bubble.getPhaseLabel(file.phase)}`);
		if (bubble.autoHideTimer)
			clearTimeout(bubble.autoHideTimer);
		if (stuck.length > 0)
			throw new Error(`Rows stayed off Done: ${stuck.join(', ')}`);
		if (bubble.state.files.size !== Names.length)
			throw new Error(`Expected ${Names.length} rows, got ${bubble.state.files.size}`);
	});
});
