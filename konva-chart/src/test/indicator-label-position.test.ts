import {expect} from 'chai';
import {indicatorLabelY} from '../main/indicator-label.js';

const padTop = 20;
const plotBottom = 320;
const fontSize = 9;

describe('indicatorLabelY', () => {
	it('places the label at the top of the plot by default', () => {
		expect(indicatorLabelY(undefined, padTop, plotBottom, fontSize)).to.equal(padTop + 2);
	});

	it('places the label at the top when explicitly "top"', () => {
		expect(indicatorLabelY('top', padTop, plotBottom, fontSize)).to.equal(padTop + 2);
	});

	it('places the label at the bottom of the data area when "bottom"', () => {
		expect(indicatorLabelY('bottom', padTop, plotBottom, fontSize)).to.equal(plotBottom - fontSize - 3);
	});

	it('keeps the bottom label inside the plot (above the bottom edge)', () => {
		const y = indicatorLabelY('bottom', padTop, plotBottom, fontSize);
		expect(y).to.be.lessThan(plotBottom);
		expect(y).to.be.greaterThan(padTop);
	});
});
