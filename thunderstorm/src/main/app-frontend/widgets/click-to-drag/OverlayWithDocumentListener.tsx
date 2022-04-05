import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';

type State = {};
type Props = {
	documentOnMouseMove?: (e: MouseEvent) => void;
	documentOnMouseUp?: (e: MouseEvent) => void;
	zIndex?: number
};

export class OverlayWithDocumentListener
	extends ComponentSync<Props, State> {

	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	onMouseMove = (e: MouseEvent) => {
		if (this.props.documentOnMouseMove) {
			this.props.documentOnMouseMove(e);
		}
	};

	onMouseUp = (e: MouseEvent) => {
		if (this.props.documentOnMouseUp) {
			this.props.documentOnMouseUp(e);
		}
	};

	componentDidMount = () => {
		this.logDebug('Mounted');
		document.addEventListener('mousemove', this.onMouseMove, false);
		document.addEventListener('mouseup', this.onMouseUp, false);
	};

	componentWillUnmount = () => {
		this.logDebug('Unmounted');
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	};

	render = () => <div
		id={`full-page-overlay-with-listener`}
		className={'full_screen'}
		style={{zIndex: this.props.zIndex}}
	/>;
}