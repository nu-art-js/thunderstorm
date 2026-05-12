import * as React from 'react';
import {useState} from 'react';
import {TS_Overlay} from '../../main/components/TS_Overlay/TS_Overlay.js';

export default function EntryOverlayV1() {
	const [show, setShow] = useState(false);
	return (
		<div data-testid="overlay-container">
			<button data-testid="overlay-toggle" onClick={() => setShow(!show)}>Toggle Overlay</button>
			<TS_Overlay showOverlay={show} onClickOverlay={() => setShow(false)}>
				<div data-testid="overlay-child">Overlay content</div>
			</TS_Overlay>
		</div>
	);
}
