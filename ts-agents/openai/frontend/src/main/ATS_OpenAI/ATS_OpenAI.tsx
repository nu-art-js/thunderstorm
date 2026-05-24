import * as React from 'react';
import {ModuleFE_OpenAI} from '../modules/ModuleFE_OpenAI.js';
import {__stringify} from '@nu-art/ts-common';
import './ATS_OpenAI.scss';

type ATS_OpenAI_Props = Record<string, never>;

type ATS_OpenAI_State = {
	directive: string;
	input: string;
	output?: string;
};

export class ATS_OpenAI
	extends React.Component<ATS_OpenAI_Props, ATS_OpenAI_State> {

	constructor(p: ATS_OpenAI_Props) {
		super(p);
		this.state = {directive: '', input: ''};
	}

	override render() {
		let value = this.state.output;
		try {
			if (value)
				value = __stringify(JSON.parse(value), true);
		} catch {
			// not a pure json response
		}

		return (
			<div className="ats-openai">
				<div className="ats-openai__section">
					App dev screen for OpenAI
					<button type="button" onClick={this.sendRequest}>Test</button>
				</div>
				<div className="ats-openai__section">
					<textarea
						className="ats-openai__textarea"
						style={{width: 1008, height: 200, marginBottom: 8, fontFamily: 'monospace', fontSize: 15}}
						value={this.state.directive}
						onChange={e => this.setState({directive: e.target.value})}
					/>
					<div className="ats-openai__row">
						<textarea
							className="ats-openai__textarea"
							style={{width: 500, height: 500, marginRight: 8, fontFamily: 'monospace', fontSize: 15}}
							value={this.state.input}
							onChange={e => this.setState({input: e.target.value})}
						/>
						<textarea
							className="ats-openai__textarea"
							style={{width: 500, height: 500, fontFamily: 'monospace', fontSize: 15}}
							readOnly
							value={value ?? ''}
						/>
					</div>
				</div>
			</div>
		);
	}

	private sendRequest = async (_e: React.MouseEvent) => {
		this.setState({output: undefined});
		const response = await ModuleFE_OpenAI.test({
			directive: this.state.directive,
			message: this.state.input,
		});
		this.setState({output: response.response});
	};
}
