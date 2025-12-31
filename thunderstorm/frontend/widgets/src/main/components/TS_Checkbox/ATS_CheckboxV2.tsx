import {thunderstormATSGroups} from '../../consts.js';
import {ComponentSync} from '@nu-art/thunderstorm-frontend';
import {Grid} from '../Layouts/index.js';
import {AppToolsScreen} from '../TS_AppTools/index.js';
import './ATS_CheckboxV2.scss';
import {TS_CheckboxV2} from './TS_CheckboxV2.js';
import {voidFunction} from '@nu-art/ts-common';

type State = {
	checked: boolean | undefined
};

class ATS_CheckboxV2_Class
	extends ComponentSync<unknown, State> {

	render() {
		return <Grid id={'ats-checkbox-v2'} onClick={() => console.log('Grid Click')}>
			{this.render_Headers()}
			{this.render_Enabled()}
			{this.render_Disabled()}
			{this.render_Free()}
		</Grid>;
	}

	private render_Headers = () => {
		return <>
			<div>State</div>
			<div>Checked</div>
			<div>Unchecked</div>
			<div>indeterminate</div>
		</>;
	};

	private render_Enabled = () => {
		return <>
			<div>Enabled</div>
			<TS_CheckboxV2 checked={true} label={'text'} onCheck={voidFunction}/>
			<TS_CheckboxV2 checked={false} label={'text'} onCheck={voidFunction}/>
			<TS_CheckboxV2 checked={undefined} label={'text'} onCheck={voidFunction}/>
		</>;
	};

	private render_Disabled = () => {
		return <>
			<div>Disabled</div>
			<TS_CheckboxV2 checked={true} label={'text'} onCheck={voidFunction} disabled={true}/>
			<TS_CheckboxV2 checked={false} label={'text'} onCheck={voidFunction} disabled={true}/>
			<TS_CheckboxV2 checked={undefined} label={'text'} onCheck={voidFunction} disabled={true}/>
		</>;
	};

	private render_Free = () => {
		return <>
			<div>Test</div>
			<TS_CheckboxV2
				checked={this.state.checked}
				onCheck={checked => this.setState({checked})}
				label={'Text'}
			/>
		</>;
	};
}

export const ATS_CheckboxV2: AppToolsScreen = {
	key: 'checkbox-v2',
	name: 'Checkbox V2',
	group: thunderstormATSGroups,
	renderer: ATS_CheckboxV2_Class,
};


