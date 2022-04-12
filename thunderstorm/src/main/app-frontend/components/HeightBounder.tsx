import * as React from 'react';
import {HTMLAttributes} from 'react';
import {ComponentSync} from '../core/ComponentSync';
import {OnWindowResized} from '../modules/WindowModule';

type BounderProps = HTMLAttributes<HTMLDivElement>;

export class HeightBounder
	extends ComponentSync<BounderProps>
	implements OnWindowResized {

	private ref?: HTMLDivElement;

	__onWindowResized(): void {
		this.forceUpdate();
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