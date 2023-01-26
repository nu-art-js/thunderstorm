/*	QWorkspaceVertical	- content display and resizing
*	When given panel contents and a page, displays content in resizable panels.*/
import * as React from 'react';
import {Fragment} from 'react';
import {PanelParentSync} from './Panels';
import {Config_PanelParent, Props_OrientedWorkspace, Props_WorkspaceParentPanel, State_WorkspaceParentPanel} from './types';

type State = {
	factors: number[];
	panelRefs: React.RefObject<HTMLDivElement>[]
}

export class TS_OrientedWorkspace
	extends PanelParentSync<{}, State, Props_OrientedWorkspace> {

	private dragStart: number = 0;
	private firstPanelBounds!: DOMRect;
	private secondPanelBounds!: DOMRect;
	private ref?: HTMLDivElement;

	protected deriveStateFromProps(nextProps: Props_WorkspaceParentPanel<Config_PanelParent, Props_OrientedWorkspace>): State_WorkspaceParentPanel<{}, State> {
		this.ref = undefined;
		const panelRefs = this.state?.panelRefs || nextProps.config.panels.map(i => React.createRef());
		return {...super.deriveStateFromProps(nextProps), factors: [], panelRefs};
	}

	private calcFactors(nextProps: Props_WorkspaceParentPanel<Config_PanelParent, Props_OrientedWorkspace>) {
		let factors = nextProps.config.panels.map(p => p.factor);
		const current = this.ref;
		if (current) {
			const wrapperWidth = current.getBoundingClientRect()[this.props.dimensionProp];
			const separatorPixels = Array.from(current.children).reduce((toRet, element, index) => {
				if (index % 2 === 0)
					return toRet;

				const rect = element.getBoundingClientRect();
				return toRet + rect[this.props.dimensionProp];
			}, 0);

			const containerFactor = (wrapperWidth - separatorPixels) / wrapperWidth;
			factors = factors.map(f => f * containerFactor);
		}

		// const sumOfFactors = factors.reduce((a, b) => a + b, 0);
		this.implementFactors(factors.map((factor, index) => ({factor, index})));
		return {factors};
	}

	//On drag logic for separator
	separatorOnDrag = (e: React.DragEvent<HTMLDivElement>, firstPanelIndex: number, secondPanelIndex: number) => {
		const firstPanel = this.props.config.panels[firstPanelIndex];
		const secondPanel = this.props.config.panels[secondPanelIndex];
		const statePanelsFactors = this.state.factors;

		//Gather data
		const delta = e[this.props.mousePos] - this.dragStart;
		const parentSize = e.currentTarget.parentElement?.[this.props.dimensionClientProp] as number;

		const separatorSize = e.currentTarget?.[this.props.dimensionClientProp] as number;

		//Calculate new heights
		const firstPanelDimension = this.firstPanelBounds[this.props.secondEdge] - this.firstPanelBounds[this.props.firstEdge];
		const secondPanelDimension = this.secondPanelBounds[this.props.secondEdge] - this.secondPanelBounds[this.props.firstEdge];

		let firstPanelSize = firstPanelDimension + delta;
		let secondPanelSize = secondPanelDimension - delta;

		const minFirstPanel = firstPanel.min || 100;
		const minSecondPanel = secondPanel.min || 100;

		if (firstPanelDimension + delta < minFirstPanel) {
			firstPanelSize = minFirstPanel;
			secondPanelSize = firstPanelDimension + secondPanelDimension - firstPanelSize;
		}

		if (secondPanelDimension - delta < minSecondPanel) {
			secondPanelSize = minSecondPanel;
			firstPanelSize = firstPanelDimension + secondPanelDimension - secondPanelSize;
		}

		const firstPanelFactor = firstPanelSize / parentSize;
		const sum = statePanelsFactors[firstPanelIndex] + statePanelsFactors[secondPanelIndex];

		statePanelsFactors[firstPanelIndex] = firstPanelFactor;
		statePanelsFactors[secondPanelIndex] = sum - firstPanelFactor;

		//Set config panels factors
		const originalFactorSum = firstPanel.factor + secondPanel.factor;

		firstPanel.factor = (firstPanelSize + separatorSize / 2) / parentSize;
		secondPanel.factor = originalFactorSum - firstPanel.factor;

		this.implementFactors([
			{index: firstPanelIndex, factor: firstPanel.factor},
			{index: secondPanelIndex, factor: secondPanel.factor}
		]);
	};

	//Gets called whenever dragging starts
	onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		//Set new empty image as the ghost image, position far offscreen
		const img = new Image();
		e.dataTransfer.setDragImage(img, -9999, -9999);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.dropEffect = 'none';

		this.dragStart = e[this.props.mousePos];
		this.firstPanelBounds = e.currentTarget.previousElementSibling?.getBoundingClientRect() as DOMRect;
		this.secondPanelBounds = e.currentTarget.nextElementSibling?.getBoundingClientRect() as DOMRect;
	};

	//Gets called whenever dragging stops
	onDragEnd = (e: React.DragEvent<HTMLDivElement>, firstPanelIndex: number, secondPanelIndex: number) => {
		//Init vars
		this.dragStart = 0;
		this.props.onConfigChanged();
	};

	//Script to implement the factor on panels in the dom
	implementFactors = (factors: { index: number, factor: number }[]) => {
		factors.forEach(factor => {
			const element = this.state.panelRefs[factor.index].current;
			if (!element)
				return;
			element.style[this.props.dimensionProp] = ((factor.factor) * 100) + '%';
		});
	};

	//Main Render
	render() {
		const panels = this.props.config.panels;
		return (
			<div ref={_ref => {
				if (this.ref || !_ref)
					return;

				this.ref = _ref;
				this.setState(this.calcFactors(this.props as any));
			}} className={`ts-workspace__${this.props.orientation}`}>
				{panels.map((panel, i) => <Fragment key={i}>
					<div className={'ts-workspace__panel'}
							 ref={this.state.panelRefs[i]}
							 draggable={false}>
						{this.renderPanel(panel)}
					</div>
					{i !== (panels.length - 1) &&
						<div className={`ts-workspace__separator`}
								 draggable={true}
								 tabIndex={1}
								 onDragStart={this.onDragStart}
								 onDrag={(e) => this.separatorOnDrag(e, i, i + 1)}
								 onDragEnd={(e) => this.onDragEnd(e, i, i + 1)}/>}
				</Fragment>)}
			</div>
		);
	}
}

export class TS_HorizontalWorkspace
	extends TS_OrientedWorkspace {
	static defaultProps = {
		firstEdge: 'left',
		secondEdge: 'right',
		orientation: 'horizontal',
		dimensionProp: 'width',
		dimensionClientProp: 'clientWidth',
		mousePos: 'pageX'
	};
}

export class TS_VerticalWorkspace
	extends TS_OrientedWorkspace {
	static defaultProps = {
		firstEdge: 'top',
		secondEdge: 'bottom',
		orientation: 'vertical',
		dimensionProp: 'height',
		dimensionClientProp: 'clientHeight',
		mousePos: 'pageY'
	};
}
