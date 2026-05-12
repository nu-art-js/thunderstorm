import * as React from 'react';
import {TS_Video} from '../../main/video/Video.js';

export default function EntryVideoV1() {
	return (
		<div data-testid="video-container">
			<TS_Video
				source={{url: '/test-video.mp4', format: 'mp4'}}
				configuration={{controls: {}}}
				width={320}
				height={180}
				unsupportedVideoMessage="Video not supported"
			/>
		</div>
	);
}
