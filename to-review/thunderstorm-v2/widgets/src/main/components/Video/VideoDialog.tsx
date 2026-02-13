import * as React from 'react';
import {ModuleFE_Dialog} from '../../component-modules/ModuleFE_Dialog.js';
import {ComponentSync} from '../../core/ComponentSync.js';
import {TS_Video_Props} from './types.js';
import {_className} from '@nu-art/thunder-core';
import {TS_Video} from './Video.js';
import './VideoDialog.scss';
import {TS_Icons} from '@nu-art/ts-styles';

type Props = Omit<TS_Video_Props, 'width' | 'height'> & {
	dialogOverlayClassName?: string;
	dialogClassName?: string;
};
type State = {
	width?: number;
	height?: number;
};

export class TS_VideoDialog
	extends ComponentSync<Props, State> {
	private ref: React.RefObject<HTMLDivElement> = React.createRef();
	//######################### Life Cycle #########################
	static show = (props: Props) => {
		ModuleFE_Dialog.show({
			content: <TS_VideoDialog {...props}/>,
			closeOverlayOnClick: () => false,
			overlayClass: props.dialogOverlayClassName,
		});
	};

	componentDidMount() {
		this.updateSizing();
	}

	//######################### Logic #########################
	private updateSizing = () => {
		const container = this.ref.current;
		if (!container)
			return;
		const rect = container.getBoundingClientRect();
		this.setState({width: rect.width, height: rect.height});
	};
	private getVideoProps = (): TS_Video_Props => {
		return {
			source: this.props.source,
			configuration: this.props.configuration,
			unsupportedVideoMessage: this.props.unsupportedVideoMessage,
			width: this.state.width ?? 0,
			height: this.state.height ?? 0
		};
	};

	//######################### Render #########################
	render() {
		const className = _className('ts-video-dialog', this.props.dialogClassName);
		return <div ref={this.ref} className={className}>
			<TS_Video {...this.getVideoProps()}/>
			<TS_Icons.x.component onClick={() => ModuleFE_Dialog.close()}/>
		</div>;
	}
}
