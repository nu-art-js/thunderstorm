/*	QWorkspaceVertical	- content display and resizing
*	When given panel contents and a page, displays content in resizable panels.*/
import * as React from 'react';
import {Props_BasePanel, Props_OrientedWorkspace, Props_PanelParent} from './types';
import {PanelParentSync} from './TS_Workspace';
import {BaseAsyncState} from '../../core/ComponentAsync';
import {Fragment} from 'react';

type State = {
	factors: number[];
}


export class TS_OrientedWorkspace extends PanelParentSync<{}, State, Props_OrientedWorkspace> {

	private dragStart: number = 0;
	private firstPanelBounds!: DOMRect;
	private secondPanelBounds!: DOMRect;
	private ref?: HTMLDivElement;

	protected deriveStateFromProps(nextProps: Props_BasePanel<Props_OrientedWorkspace & Props_PanelParent>): BaseAsyncState & State {
		this.ref = undefined;
		return {factors: []};
	}

	private calcFactors(nextProps: Props_BasePanel<Props_OrientedWorkspace & Props_PanelParent>) {
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

		const sumOfFactors = factors.reduce((a, b) => a + b, 0);
		console.log(sumOfFactors);

		return {factors};
	}

//On drag logic for separator
	separatorOnDrag = (e: React.DragEvent<HTMLDivElement>, firstPanelIndex: number, secondPanelIndex: number) => {
		//Gather data
		const delta = e[this.props.mousePos] - this.dragStart;
		const parentSize = e.currentTarget.parentElement?.[this.props.dimensionClientProp] as number;

		//Calculate new heights
		const firstPanelDimension = this.firstPanelBounds[this.props.secondEdge] - this.firstPanelBounds[this.props.firstEdge];
		const secondPanelDimension = this.secondPanelBounds[this.props.secondEdge] - this.secondPanelBounds[this.props.firstEdge];

		let firstPanelSize = firstPanelDimension + delta;
		let secondPanelSize = secondPanelDimension - delta;

		const minFirstPanel = this.props.config.panels[firstPanelIndex].min || 100;
		const minSecondPanel = this.props.config.panels[secondPanelIndex].min || 100;

		if (firstPanelDimension + delta < minFirstPanel) {
			firstPanelSize = minFirstPanel;
			secondPanelSize = firstPanelDimension + secondPanelDimension - firstPanelSize;
		}

		if (secondPanelDimension - delta < minSecondPanel) {
			secondPanelSize = minSecondPanel;
			firstPanelSize = firstPanelDimension + secondPanelDimension - secondPanelSize;
		}

		const firstPanelFactor = firstPanelSize / parentSize;
		const sum = this.state.factors[firstPanelIndex] + this.state.factors[secondPanelIndex];

		this.state.factors[firstPanelIndex] = firstPanelFactor;
		this.state.factors[secondPanelIndex] = sum - firstPanelFactor;

		this.forceUpdate();
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
	onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
		// WorkspaceModuleFE.setWorkspacePanelSizes(this.state.page, panelSizes);
		this.dragStart = 0;
		this.state.factors.forEach((factor, i) => this.props.config.panels[i].factor = factor);
	};


	//Main Render
	render() {
		const panels = this.props.config.panels;
		return (
			<div key="kakey" ref={_ref => {
				if (this.ref || !_ref)
					return;

				this.ref = _ref;
				this.setState(this.calcFactors(this.props as any));
			}} className={`ts-workspace__${this.props.orientation}`}>
				{panels.map((panel, i) => <Fragment key={i}>
					<div className={'ts-workspace__panel'}
							 style={{[this.props.dimensionProp]: ((this.state.factors[i]) * 100) + '%'}}
							 draggable={false}>
						{this.renderPanel(panel)}
					</div>
					{i !== (panels.length - 1) &&
						<div className={`ts-workspace__separator`}
								 draggable={true}
								 tabIndex={1}
								 onDragStart={this.onDragStart}
								 onDrag={(e) => this.separatorOnDrag(e, i, i + 1)}
								 onDragEnd={(e) => this.onDragEnd(e)}/>}
				</Fragment>)}
			</div>
		);
	}
}

export class TS_HorizontalWorkspace extends TS_OrientedWorkspace {
	static defaultProps = {
		firstEdge: 'left',
		secondEdge: 'right',
		orientation: 'horizontal',
		dimensionProp: 'width',
		dimensionClientProp: 'clientWidth',
		mousePos: 'pageX'
	};
}

export class TS_VerticalWorkspace extends TS_OrientedWorkspace {
	static defaultProps = {
		firstEdge: 'top',
		secondEdge: 'bottom',
		orientation: 'vertical',
		dimensionProp: 'height',
		dimensionClientProp: 'clientHeight',
		mousePos: 'pageY'
	};
}
