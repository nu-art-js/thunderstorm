import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Video_Props, TS_VideoConfiguration, TS_VideoSource} from './types';

const defaultVideoUnsupportedMessage = 'Video not supported in this browser';

type State = {
	source: TS_VideoSource;
	configuration: TS_VideoConfiguration;
	width: number;
	height: number;
	unsupportedVideoMessage: string;
};

export class TS_Video
	extends ComponentSync<TS_Video_Props, State> {

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: TS_Video_Props, state: State): State {
		state.source = nextProps.source;
		state.configuration = nextProps.configuration;
		state.unsupportedVideoMessage = nextProps.unsupportedVideoMessage ?? defaultVideoUnsupportedMessage;
		state.width = nextProps.width;
		state.height = nextProps.height;
		return state;
	}

	//######################### Logic #########################

	//######################### Render #########################

	render() {
		return <video
			width={this.state.width}
			height={this.state.height}
			controls={this.state.configuration.controls}
			autoPlay={this.state.configuration.autoplay}
			muted={this.state.configuration.muted}
		>
			<source src={this.state.source.url} type={`video/${this.state.source.format}`}/>
			{this.state.unsupportedVideoMessage}
		</video>;
	}
}