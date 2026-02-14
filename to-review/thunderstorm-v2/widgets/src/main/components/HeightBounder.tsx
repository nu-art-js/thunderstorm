import {HTMLAttributes} from 'react';
import {ComponentSync} from '../_core/ComponentSync.js';

import {addWindowResizeListener, OnWindowResized, removeWindowResizeListener} from '@nu-art/thunder-core';

type BounderProps = HTMLAttributes<HTMLDivElement>;

export class HeightBounder
	extends ComponentSync<BounderProps>
	implements OnWindowResized {

	private ref?: HTMLDivElement;

	__onWindowResized(): void {
		this.forceUpdate();
	}

	componentDidMount() {
		addWindowResizeListener(this);
	}

	componentWillUnmount() {
		removeWindowResizeListener(this);
	}

	protected deriveStateFromProps(nextProps: BounderProps): any {
		return {};
	}

	render() {
		const ref = this.ref;
		let height = undefined;
		if (ref)
			height = `${window.innerHeight - ref.offsetTop - 3}px`;

		const tempProps = {...this.props};
		delete tempProps.style;
		return <div {...tempProps}
								style={{...this.props.style, height}}
								ref={((_ref) => {
									if (this.ref)
										return;

									this.ref = _ref as HTMLDivElement;
									this.forceUpdate();
								})}>
			{this.props.children}
		</div>;
	}
}
