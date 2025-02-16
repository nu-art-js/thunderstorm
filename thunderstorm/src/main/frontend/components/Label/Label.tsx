import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import './Label.scss';
import {OnWindowResized} from '../../modules/ModuleFE_Window';

type Props = React.PropsWithChildren<{
	tooltip?: string;
	className?: string;
}>;

type State = {
	tooltip: string;
	className?: string;
};

export class Label
	extends ComponentSync<Props, State>
	implements OnWindowResized {

	private readonly labelRef = React.createRef<HTMLDivElement>();
	private readonly activeTruncationClass = 'truncate-active';
	private readonly activeTooltipClass = 'tooltip-active';

	// ######################## Life Cycle ########################

	__onWindowResized() {
		this.checkOverflow();
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.tooltip = nextProps.tooltip ?? '';
		state.className = nextProps.className;
		return state;
	}

	componentDidMount() {
		this.checkOverflow();
	}

	componentDidUpdate() {
		this.checkOverflow();
	}

	// ######################## Logic ########################

	private checkOverflow = () => {
		const el = this.labelRef.current;
		if (!el)
			return;

		const overflowing = el.scrollWidth > el.clientWidth;
		//Not overflowing - make sure truncation and tooltip classes aren't applied
		if (!overflowing) {
			if (el.classList.contains(this.activeTruncationClass))
				el.classList.remove(this.activeTruncationClass);

			if (el.classList.contains(this.activeTooltipClass))
				el.classList.remove(this.activeTooltipClass);

			return;
		}
		//Overflowing
		//Always apply truncation
		if (!el.classList.contains(this.activeTruncationClass))
			el.classList.add(this.activeTruncationClass);

		//Apply tooltip if one is provided
		if (!el.classList.contains(this.activeTooltipClass) && this.state.tooltip)
			el.classList.add(this.activeTooltipClass);
	};

	// ######################## Render ########################


	render() {
		const className = _className('ts-label', this.state.className);
		return <div
			ref={this.labelRef}
			className={className}
			data-tooltip={this.state.tooltip}
		>
			<div className={'ts-label__content'}>{this.props.children}</div>
		</div>;
	}
}