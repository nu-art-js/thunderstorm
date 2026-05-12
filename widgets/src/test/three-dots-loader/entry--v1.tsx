import * as React from 'react';
import {ThreeDotsLoader} from '../../main/loaders/ThreeDotsLoader.js';

export default function EntryThreeDotsLoaderV1() {
	return (
		<div data-testid="loader-three-dots-container">
			<ThreeDotsLoader/>
		</div>
	);
}
