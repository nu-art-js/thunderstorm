import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {AppToolsScreen, TS_AppTools} from '../TS_AppTools';
import {LL_H_C, LL_V_L} from '../Layouts';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {TS_TextArea} from './TS_TextArea';
import './ATS_TextArea.scss';

type State = {
	regularValue?: string;
	resizeValue?: string;
};

export class ATS_TextArea
	extends ComponentSync<{}, State> {

	static Screen: AppToolsScreen = {
		group: 'TS Components',
		name: 'TS_TextArea',
		key: 'ts-textarea',
		renderer: this,
	};

	render() {
		return <LL_V_L className={'ats__ts-text-area'}>
			{TS_AppTools.renderPageHeader('TS_TextArea Tests')}
			<LL_H_C className={'ats__ts-text-area__content'}>
				{this.renderRegularTextArea()}
				{this.renderResizingTextArea()}
			</LL_H_C>
		</LL_V_L>;
	}

	private renderRegularTextArea = () => {
		return <TS_PropRenderer.Vertical label={'Regular Text Area'}>
			<TS_TextArea
				type={'text'}
				value={this.state.regularValue}
				onChange={value => this.setState({regularValue: value})}
			/>
		</TS_PropRenderer.Vertical>;
	};

	private renderResizingTextArea = () => {
		return <TS_PropRenderer.Vertical label={'Resizing Text Area'}>
			<TS_TextArea
				type={'text'}
				resizeWithText={true}
				value={this.state.resizeValue}
				onChange={value => this.setState({resizeValue: value})}
			/>
		</TS_PropRenderer.Vertical>;
	};
}