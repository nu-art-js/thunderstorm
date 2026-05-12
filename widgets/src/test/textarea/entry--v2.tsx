import * as React from 'react';
import {useState} from 'react';
import {TS_TextArea} from '../../main/textarea/v2/index.js';

export default function EntryTextAreaV2() {
	const [v2Value, setV2Value] = useState('');
	return (
		<div data-testid="textarea-v2-container">
			<label htmlFor="textarea-v2">TextArea v2</label>
			<TS_TextArea id="textarea-v2" value={v2Value} onChange={(v) => setV2Value(v)} placeholder="v2 placeholder"/>
		</div>
	);
}
