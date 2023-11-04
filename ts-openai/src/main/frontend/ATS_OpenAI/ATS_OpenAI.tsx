import * as React from 'react';
import {AppToolsScreen, ComponentSync, LL_H_T, LL_V_L, TS_BusyButton} from '@nu-art/thunderstorm/frontend';
import {TS_TextAreaV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_TextArea';
import {ModuleFE_OpenAI} from '../modules/ModuleFE_OpenAI';
import {__stringify} from '@nu-art/ts-common';


type ATS_OpenAI_Props = {
	//
};
type ATS_OpenAI_State = {
	output?: string
};

/**
 * in this example the backend config should be something of this sort:
 *
 * ```
 * {
 *   directives: {
 *      'address-resolver': 'You are a Typescript address resolving assistant, you return a JSON with the following props: city, streetName, houseNumber, entrance (single letter), floor, apartmentNumber, country and additionalInfo. The JSON props must remain in english whereas the values need to be translated to valid addresses in Hebrew. unavailable props should be omitted from the JSON\'s props',
 *   },
 *   defaultModel: 'gpt-4',
 *   apiKey: 'YourAPI-Key',
 *   orgId: 'YourORG-Id'
 * }
 * ```
 */
export class ATS_OpenAI
	extends ComponentSync<ATS_OpenAI_Props, ATS_OpenAI_State> {

	static screen: AppToolsScreen = {name: `DevTool - OpenAI`, renderer: this};

	static defaultProps = {
		modules: [],
		pageTitle: () => this.screen.name
	};

	protected deriveStateFromProps(nextProps: ATS_OpenAI_Props, state = {} as ATS_OpenAI_State): ATS_OpenAI_State | undefined {
		return {output: undefined};
	}

	constructor(p: ATS_OpenAI_Props) {
		super(p);
	}

	render() {
		let value = this.state.output;
		try {
			if (value)
				value = __stringify(JSON.parse(value), true);
		} catch (e: any) {
			// not a pure json response
		}

		this.logInfo(value);
		return <LL_H_T>
			<LL_V_L>
				App dev screen for OpenAI
				<TS_BusyButton onClick={this.sendRequest}>Test</TS_BusyButton>
			</LL_V_L>
			<LL_V_L>
				<TS_TextAreaV2 className={'ts-textarea'} style={{width: 500, height: 500, fontFamily: 'monospace', fontSize: 15}} disabled value={value}/>
			</LL_V_L>
		</LL_H_T>;
	}

	private sendRequest = async (e: React.MouseEvent) => {
		const response = await ModuleFE_OpenAI.v1.test({
			directive: 'address-resolver',
			message: __stringify({
				'address1': 'Haroe 103',
				'address2': 'Apartment 4',
				'city': 'Ramat gan',
				'country': 'Israel'
			})
		}).executeSync();
		this.logWarning(response);
		this.setState({output: response.response});
	};
}