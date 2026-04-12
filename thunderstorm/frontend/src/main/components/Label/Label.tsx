import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync.js';
import {_className} from '../../utils/tools.js';
import './Label.scss';
import {OnWindowResized} from '../../modules/ModuleFE_Window.js';

type Props = React.PropsWithChildren<{
	tooltip?: React.ReactNode; //The content that will appear in the tooltip
	className?: string;
	containerSelector?: string; //A container for the tooltip direction calculation
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	forceUpdate?: boolean;
}>;

type State = {
	tooltip: React.ReactNode;
	className?: string;
	containerSelector?: string;
	forceUpdate: boolean;
};

export class Label
	extends ComponentSync<Props, State>
	implements OnWindowResized {

	private readonly labelRef = React.createRef<HTMLDivElement>();
	private readonly activeTruncationClass = 'truncate-active';
	private readonly activeTooltipClass = 'tooltip-active';
	private readonly invertTooltipClass = 'invert-tooltip';

	// ######################## Life Cycle ########################

	__onWindowResized() {
		this.checkOverflow();
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.tooltip = nextProps.tooltip ?? '';
		state.className = nextProps.className;
		state.containerSelector = nextProps.containerSelector;
		state.forceUpdate = !!nextProps.forceUpdate;
		return state;
	}

	public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		return nextState.forceUpdate || super.shouldComponentUpdate(nextProps, nextState, nextContext);
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

	private checkTooltipDir = () => {
		const el = this.labelRef.current;
		if (!el || !this.state.containerSelector)
			return;

		const container = el.closest(this.state.containerSelector);
		if (!container)
			return;

		const containerTop = container.getBoundingClientRect().top;
		const labelRect = el.getBoundingClientRect();
		const distance = labelRect.top - containerTop;
		//Should be inverted
		if (distance <= labelRect.height * 2.5) {
			if (!el.classList.contains(this.invertTooltipClass))
				el.classList.add(this.invertTooltipClass);
		} else { //Should not be inverted
			if (el.classList.contains(this.invertTooltipClass))
				el.classList.remove(this.invertTooltipClass);
		}
	};

	private getProps = () => {
		const {tooltip, className, containerSelector, onClick, ...rest} = this.props;
		return {
			...rest,
			className: _className('ts-label', className),
			'data-tooltip': this.state.tooltip,
			onMouseEnter: this.checkTooltipDir,
			onClick,
			ref: this.labelRef,
		};
	};

	// ######################## Render ########################

	render() {
		return <div {...this.getProps()}>
			<div className={'ts-label__content'}>{this.props.children}</div>
		</div>;
	}
}