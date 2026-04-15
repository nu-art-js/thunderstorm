import {thunderstormATSGroups} from '../consts.js';
import {ComponentSync, Grid, TS_Checkbox} from '@nu-art/thunder-widgets/v3';
import './ATS_Checkbox.scss';
import {voidFunction} from '@nu-art/ts-common';
import {AppToolsScreen} from '../TS_AppTools/types.js';


type State = {
	checked: boolean | undefined;
};

class ATS_Checkbox_Class
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
			<TS_Checkbox checked={true} label={'text'} onCheck={voidFunction}/>
			<TS_Checkbox checked={false} label={'text'} onCheck={voidFunction}/>
			<TS_Checkbox checked={undefined} label={'text'} onCheck={voidFunction}/>
		</>;
	};
	private render_Disabled = () => {
		return <>
			<div>Disabled</div>
			<TS_Checkbox checked={true} label={'text'} onCheck={voidFunction} disabled={true}/>
			<TS_Checkbox checked={false} label={'text'} onCheck={voidFunction} disabled={true}/>
			<TS_Checkbox checked={undefined} label={'text'} onCheck={voidFunction} disabled={true}/>
		</>;
	};
	private render_Free = () => {
		return <>
			<div>Test</div>
			<TS_Checkbox checked={this.state.checked} onCheck={checked => this.setState({checked})} label={'Text'}/>
		</>;
	};
}

export const ATS_Checkbox: AppToolsScreen = {
	key: 'checkbox-v2',
	name: 'Checkbox V2',
	group: thunderstormATSGroups,
	renderer: ATS_Checkbox_Class,
};
