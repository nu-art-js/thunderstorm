import * as React from 'react';
import {ModuleFE_Dialog} from '../../main/dialog/ModuleFE_Dialog.js';
import {TS_DialogOverlay} from '../../main/dialog/TS_DialogOverlay.js';

export default function EntryDialogV1() {
	return (
		<div data-testid="dialog-demo-container">
			<button data-testid="dialog-open-trigger" onClick={() => {
				ModuleFE_Dialog.show({
					content: (close) => (
						<div data-testid="test-dialog-content">
							<span>Dialog content</span>
							<button onClick={() => ModuleFE_Dialog.close()}>Close</button>
						</div>
					),
				});
			}}>Open Dialog
			</button>
			<TS_DialogOverlay/>
		</div>
	);
}
