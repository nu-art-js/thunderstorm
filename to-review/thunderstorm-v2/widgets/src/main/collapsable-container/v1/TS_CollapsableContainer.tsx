/**
 * @deprecated Use TS_CollapsableContainerV2 instead. This component will be removed in a future release.
 *
 * ## Migration to V2
 *
 * 1. **Import:** Replace `TS_CollapsableContainer` with `TS_CollapsableContainerV2` from the same package.
 *
 * 2. **Render props:** V2 uses `ResolvableContent<ReactNode>` — pass `ReactNode` or `() => ReactNode` as before;
 *    both are supported via `resolveContent()` from `@nu-art/ts-common`.
 *
 * 3. **Removed / renamed:**
 *    - `showCaret` — V2 always shows a caret; use `customCaret` to override (e.g. pass `null` or a custom node if you need to hide it).
 *    - `flipHeaderOrder` — Not in V2; adjust layout via CSS or wrapper if needed.
 *    - `maxHeight` — V2 uses CSS-based layout; use `className` or `style` to constrain height if needed.
 *    - `onMouseEnter` / `onMouseLeave` / `onMouseOver` — Not in V2; attach to a wrapper div if needed.
 *
 * 4. **New in V2:** `animated` (CSS transitions), `forceUpdate` (re-render when parent updates). Use `animated={true}` for expand/collapse animation.
 *
 * 5. **Controlled / uncontrolled:** Same pattern — `collapsed` for controlled, `initialCollapsed` for uncontrolled; `onCollapseToggle` works the same.
 */
import {TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import {ReactNode} from 'react';
import './TS_CollapsableContainer.scss';
import {ComponentSync} from '../../_core/ComponentSync.js';
import {_className} from '@nu-art/thunder-core';
import {LL_V_L} from '../../layouts/index.js';

type Props = {
	headerRenderer: ReactNode | (() => ReactNode);
	containerRenderer: ReactNode | (() => ReactNode);
	collapsed?: boolean;
	showCaret?: boolean;
	onCollapseToggle?: (collapseState: boolean, e: React.MouseEvent) => void;
	maxHeight?: number | string;
	style?: TypedMap<string>;
	className?: string;
	id?: string;
	customCaret?: ReactNode | (() => ReactNode);
	flipHeaderOrder?: boolean;
	onMouseEnter?: (e: React.MouseEvent) => void;
	onMouseLeave?: (e: React.MouseEvent) => void;
	initialCollapsed?: boolean;
	onMouseOver?: (e: React.MouseEvent) => void;
	onHeaderRightClick?: (e: React.MouseEvent) => void;
	innerRef?: React.RefObject<HTMLDivElement>;
};
type State = {
	collapsed: boolean;
	contentRef: React.RefObject<any>;
	containerRef: React.RefObject<HTMLDivElement>;
};

/** @deprecated Use TS_CollapsableContainerV2. See file-level JSDoc for migration. */
export class TS_CollapsableContainer
	extends ComponentSync<Props, State> {
	protected deriveStateFromProps(nextProps: Props): State {
		const state: State = this.state ? {...this.state} : {} as State;
		state.collapsed = nextProps.collapsed ?? this.state?.collapsed ?? (nextProps.initialCollapsed ?? true);
		state.contentRef ??= React.createRef();
		state.containerRef ??= React.createRef();
		return state;
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
		this.setContainerHeight();
	}

	componentDidMount() {
		if (this.state.collapsed)
			this.setContainerHeight();
		else
			setTimeout(() => this.setContainerHeight(), 10);
	}

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		return true;
	}

	private setContainerHeight = () => {
		if (!this.state.containerRef.current)
			return;
		const currentContent = this.state.contentRef.current;
		const maxHeight = this.state.collapsed
			? 0
			: this.props.maxHeight ? this.props.maxHeight : currentContent.getBoundingClientRect().height;
		this.state.containerRef.current.style.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
	};
	private toggleCollapse = (e: React.MouseEvent) => {
		this.props.onCollapseToggle?.(this.isCollapsed(), e);
		if (this.props.collapsed !== undefined)
			return;
		this.setState({collapsed: !this.state.collapsed});
	};

	private isCollapsed() {
		return this.props.collapsed !== undefined ? this.props.collapsed : this.state.collapsed;
	}

	public refreshContainerHeight = () => {
		if (!this.state.collapsed)
			this.setContainerHeight();
	};

	private renderCaret() {
		if (this.props.showCaret === false)
			return '';
		const collapsed = this.isCollapsed();
		const className = _className('ts-collapsable-container__header__caret', collapsed ? 'collapsed' : undefined);
		if (this.props.customCaret)
			return <span className={className}>
			{typeof this.props.customCaret === 'function' ? this.props.customCaret() : this.props.customCaret}
		</span>;
		return <span className={className}>
			{this.isCollapsed() ? '+' : '-'}
		</span>;
	}

	renderHeader() {
		const className = _className('ts-collapsable-container__header', this.isCollapsed() ? 'collapsed' : undefined, this.props.flipHeaderOrder
			? 'flip'
			: undefined);
		return <div className={className} onClick={this.toggleCollapse} onContextMenu={this.props.onHeaderRightClick}>
			{this.renderCaret()}
			{typeof this.props.headerRenderer === 'function' ? this.props.headerRenderer() : this.props.headerRenderer}
		</div>;
	}

	renderContainer() {
		const className = _className('ts-collapsable-container__container', this.isCollapsed() ? 'collapsed' : undefined);
		return <div className={className} ref={this.state.containerRef}>
			<div ref={this.state.contentRef} className={'ts-collapsable-container__container-wrapper'} style={{width: '100%'}}>
				{(typeof this.props.containerRenderer === 'function' ? this.props.containerRenderer() : this.props.containerRenderer)}
			</div>
		</div>;
	}

	render() {
		const className = _className('ts-collapsable-container', this.props.className);
		return <LL_V_L className={className} style={this.props.style} id={this.props.id} onMouseOver={this.props.onMouseOver} onMouseEnter={this.props.onMouseEnter}
									 onMouseLeave={this.props.onMouseLeave} innerRef={this.props.innerRef}>
			{this.renderHeader()}
			{this.renderContainer()}
		</LL_V_L>;
	}
}
