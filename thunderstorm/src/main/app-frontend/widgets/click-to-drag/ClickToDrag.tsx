import * as React from 'react';
import {OverlayWithDocumentListener} from './OverlayWithDocumentListener';

type Props = {
	onMouseMove?: (e: MouseEvent) => void;
	onMouseUp?: (e: MouseEvent) => void;
	overlayZIndex?: number;
};

type State = {
	isDragging: boolean;
};

export class ClickToDrag
	extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props);
		this.state = {
			isDragging: false
		};
	}

	handleMouseDown = () => {
		this.setState({isDragging: true});
	};

	onMouseMove = (e: MouseEvent) => {
		if (!this.state.isDragging)
			return;

		if (this.props.onMouseMove)
			this.props.onMouseMove(e);
	};

	onMouseUp = (e: MouseEvent) => {
		this.setState({isDragging: false});
		if (this.props.onMouseUp)
			this.props.onMouseUp(e);
	};

	render = () => {
		return (
			<div
				style={{display: 'contents'}}
				onMouseDown={this.handleMouseDown}>
				{this.props.children}
				{this.renderOverlay()}
			</div>
		);
	};

	private renderOverlay = () => {
		return this.state.isDragging &&
			<OverlayWithDocumentListener
				documentOnMouseMove={this.onMouseMove}
				documentOnMouseUp={this.onMouseUp}
				zIndex={this.props.overlayZIndex}
			/>;
	};
}