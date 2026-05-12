import * as React from 'react';
import {TS_CopyToClipboard} from '../../main/copy-to-clipboard/v1/TS_CopyToClipboard.js';

export default function EntryCopyToClipboardV1() {
	return (
		<div data-testid="copy-to-clipboard-container">
			<TS_CopyToClipboard textToCopy="test">Copy</TS_CopyToClipboard>
		</div>
	);
}
