import * as React from 'react';
import {useState} from 'react';
import {TS_TextArea} from '../../main/textarea/v2/index.js';

export default function EntryTextAreaV2() {
	const [v2Value, setV2Value] = useState('');
	const [wrapValue, setWrapValue] = useState('');
	return (
		<div data-testid="textarea-v2-container">
			<style>{'* { white-space: nowrap; }'}</style>
			<label htmlFor="textarea-v2">TextArea v2</label>
			<TS_TextArea id="textarea-v2" value={v2Value} onChange={(v) => setV2Value(v)} placeholder="v2 placeholder"/>
			<TS_TextArea id="textarea-v2-wrap" wrap style={{width: 280, height: 120}} value={wrapValue} onChange={(v) => setWrapValue(v)}/>
		</div>
	);
}
