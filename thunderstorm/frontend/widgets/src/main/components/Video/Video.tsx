import * as React from 'react';
import { ComponentSync } from "@nu-art/thunder-routing";
import { TS_Video_Props, TS_VideoConfiguration, TS_VideoControlsConfiguration, TS_VideoSource } from './types.js';
import { exists } from '@nu-art/ts-common';
const defaultVideoUnsupportedMessage = 'Video not supported in this browser';
type State = {
    source: TS_VideoSource;
    configuration: TS_VideoConfiguration;
    width: number;
    height: number;
    unsupportedVideoMessage: string;
};
export class TS_Video extends ComponentSync<TS_Video_Props, State> {
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
    private getControlsList = (config?: TS_VideoControlsConfiguration): string | undefined => {
        if (!config)
            return;
        const list: string[] = [];
        if (config.noDownload)
            list.push('nodownload');
        return list.join(' ');
    };
    private getProps = (): React.HTMLProps<HTMLVideoElement> => {
        return {
            width: this.state.width,
            height: this.state.height,
            autoPlay: this.state.configuration.autoplay,
            muted: this.state.configuration.muted,
            //Controls props
            controls: exists(this.state.configuration.controls),
            // @ts-ignore
            controlsList: this.getControlsList(this.state.configuration.controls)
        };
    };
    //######################### Render #########################
    render() {
        return <video {...this.getProps()}>
			<source src={this.state.source.url} type={`video/${this.state.source.format}`}/>
			{this.state.unsupportedVideoMessage}
		</video>;
    }
}
