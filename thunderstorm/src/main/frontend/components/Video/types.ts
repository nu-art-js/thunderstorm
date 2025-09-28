export type TS_VideoSourceFormat = 'mp4' | 'webm' | 'ogg';
export type TS_VideoSource = { url: string, format: TS_VideoSourceFormat };

export type TS_VideoControlsConfiguration = {
	noDownload?: boolean;
}

export type TS_VideoConfiguration = {
	controls?: TS_VideoControlsConfiguration;
	autoplay?: boolean;
	muted?: boolean;
}


export type TS_Video_Props = {
	source: TS_VideoSource;
	configuration: TS_VideoConfiguration;
	width: number;
	height: number;
	unsupportedVideoMessage?: string;
};