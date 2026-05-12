import * as React from 'react';
import {TS_Slider} from '../../main/slider/v3/TS_Slider.js';

export default function EntrySliderV3() {
	return (
		<div data-testid="slider-v3-container">
			<TS_Slider min={0} max={100} startValue={50}/>
		</div>
	);
}
