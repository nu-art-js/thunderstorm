import * as React from "react";
import {ReactNode} from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {
	ScaleLinear,
	scaleLinear
} from "d3-scale";
import AxisLeft from "./Example_AxisX";
import AxisBottom from "./Example_AxisBottom.";
import {deepClone} from "@nu-art/ts-common";

export type Coordinates = {
	x: number,
	y: number
}

export type D3ChartData = {
	label: string | number | ReactNode,
	data: Coordinates[],
	color: string,
	baseValue?: number
}

export type AxesLabels = {
	x?: string[],
	y?: string[]
}

export type Props = {
	data: D3ChartData[],
	xDomain: number,
	frequency: number,
	axesLabels?: AxesLabels,
	startFromValue?: number,
	endFrameValue?: number,
	borderBoxValues?: string[],
	renderBottomAxis?: (scale: ScaleLinear<number, number, any>, height: number) => JSX.Element,
	renderLeftAxis?: (scale: ScaleLinear<number, number, any>, width: number) => JSX.Element,
	renderPoints?: (dataPoint: Coordinates) => JSX.Element
	renderLines?: (startPoint: Coordinates, endPoint: Coordinates) => JSX.Element
}

export class Example_LineGraph
	extends BaseComponent<Props, { page: number, index: number }> {

	constructor(props: Props) {
		super(props);
		this.state = {
			page: 0,
			index: 0
		};

	}


	private minAndMax = () => {
		let arrayOfProps: Coordinates[] = [];
		this.props.data.map(_lineData => {
			arrayOfProps = arrayOfProps.concat([], this.batchAllData(_lineData.data)[this.state.page]);
		});
		return this.extent(arrayOfProps);
	};

	private dataPoints = (data: Coordinates[], color: string) => data.map((d, i) => this.props.renderPoints ? this.props.renderPoints({x: this.xScale()(d.x), y: this.yScale()(d.y)}) :
		(<circle onMouseEnter={(e) => {
			}}
		         key={i}
		         r={5}
		         cx={this.xScale()(d.x + this.props.frequency)}
		         cy={this.yScale()(d.y)}
		         style={{fill: color}}
			/>
		));

	private lines = (color: string, data: Coordinates[]) => {
		const lineArray = [];
		if (data.length > 1)
			for (let i = 0; i < data.length - 1; i++) {
				this.props.renderLines ? lineArray.push(
					this.props.renderLines({x: this.xScale()(data[i].x + this.props.frequency), y: this.yScale()(data[i].y)},
					                       {x: this.xScale()(data[i].x + this.props.frequency), y: this.yScale()(data[i].y)})) :
					lineArray.push(<line key={i} x1={this.xScale()(data[i].x + this.props.frequency)} x2={this.xScale()(data[i + 1].x + this.props.frequency)} y1={this.yScale()(data[i].y)}
					                     y2={this.yScale()(data[i + 1].y)}
					                     strokeWidth={3} stroke={color}/>);
			}
		return lineArray;
	};

	private baseLine = (baseValue: number, color: string) => <line x1={this.xScale()(this.minAndMax().minX)} x2={this.width} y1={this.yScale()(baseValue)}
	                                                               y2={this.yScale()(baseValue)} strokeWidth={3} stroke={color} strokeDasharray={4} opacity={0.5}/>;

	w = 600;
	h = 300;
	margin = {
		top: 40,
		bottom: 40,
		left: 40,
		right: 40
	};
	width = this.w - this.margin.right - this.margin.left;
	height = this.h - this.margin.top - this.margin.bottom;

	extent = (domain: Coordinates[]) => {
		let minX = Number.MAX_VALUE;
		let maxX = Number.MIN_VALUE;
		let minY = this.props.startFromValue ? this.props.startFromValue : Number.MAX_VALUE;
		let maxY = this.props.endFrameValue ? this.props.endFrameValue : Number.MIN_VALUE;
		domain.forEach(_xy => {
			if (_xy.x < minX)
				minX = _xy.x;
			if (_xy.y < minY)
				minY = _xy.y;
			if (_xy.x > maxX)
				maxX = _xy.x;
			if (_xy.y > maxY)
				maxY = _xy.y;
		});
		return {minX, maxX, minY, maxY};
	};

	xScale = () => {
		const range = this.props.frequency * this.props.xDomain;
		return scaleLinear()
			.domain([this.minAndMax().minX, this.minAndMax().minX + range])
			.range([0, this.width]);
	};

	yScale = () => scaleLinear()
		.domain([this.minAndMax().minY, this.minAndMax().maxY])
		.range([this.height, this.minAndMax().minY]);

	private maxPage = 0;

	batchAllData = (data: Coordinates[]) => {
		const arrayOfBatches: Coordinates[][] = [];
		const week = this.props.xDomain * this.props.frequency;
		let currentBatch: Coordinates[] = [];
		let index = 0;
		data.forEach(_data => {
			if (_data.x <= data[index].x + week)
				return currentBatch.push(_data);
			arrayOfBatches.push(deepClone(currentBatch));
			index += currentBatch.length;
			currentBatch = [_data];
		});
		if (arrayOfBatches.indexOf(currentBatch) === -1)
			arrayOfBatches.push(currentBatch);
		this.maxPage = arrayOfBatches.length;
		return arrayOfBatches;
	};


	render() {
		return <>
			<svg width={this.w} height={this.h} style={{float: 'left', overflow: 'visible'}}>
				<g transform={`translate(${this.margin.left},${this.margin.top})`}>
					<AxisLeft
						yScale={this.yScale()}
						width={this.width + 100}
						axisPoint={this.xScale()(this.minAndMax().minX)}/>
					{this.props.renderBottomAxis ? this.props.renderBottomAxis(this.xScale(), this.height) :
						<AxisBottom xScale={this.xScale()}
						            height={this.height}
						            width={this.width + 100}
						            tickValues={this.props.axesLabels?.x}
						            borderBoxValues={this.props.borderBoxValues}
						            paginated={true}
						            frequency={this.props.frequency}
						            axisPoint={this.minAndMax().minX}
						            viewBox={this.props.xDomain}
						            shiftData={true}/>
					} {this.props.data.map(_data => this.lines(_data.color, this.batchAllData(_data.data)[this.state.page]))}
					{this.props.data.map(_data => this.dataPoints(this.batchAllData(_data.data)[this.state.page], _data.color))}
					{this.props.data.map(_data => _data.baseValue && this.baseLine(_data.baseValue, _data.color))}
				</g>
			</svg>
			<div onClick={() => {
				if (this.state.page < this.maxPage - 1)
					this.setState(state => ({page: state.page + 1}));
			}}>hello!
			</div>
			<div onClick={() => {
				if (this.state.page > 0)
					this.setState(state => ({page: state.page - 1}));
			}}>goodbye!
			</div>
		</>;
	}

}


export default Example_LineGraph;