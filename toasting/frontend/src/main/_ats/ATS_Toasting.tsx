import {AppToolsScreen, Button, ComponentSync, Grid, LL_H_C} from '@nu-art/thunderstorm-frontend';
import {thunderstormCapabilitiesGroup} from '@nu-art/thunderstorm-frontend/consts';
import {Toaster} from '../_core/Toaster.js';
import {ToasterPortal_TopDown, ToasterPortal_Vertical} from '../_ui/ToasterPortal/index.js';
import './ATS_Toasting.scss';
import {ToastProperties} from '../_core/types.js';
import {generateLoremIpsum} from '@nu-art/ts-common';

const generateModel = (title: string): ToastProperties => {
	const length = Math.floor(Math.random() * 1000);
	return {
		title,
		body: generateLoremIpsum(length)
	};
};

class ATS_Toasting_Class
	extends ComponentSync {

	private toaster_Vertical = new Toaster('ats-vertical');
	private toaster_TopDown = new Toaster('ats-top-down', 1000);

	render() {
		return <LL_H_C className={'ats__toasting'}>
			<Grid>
				{/*Vertical Buttons*/}
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastGeneral(generateModel('General Toast'))}>Vertical - General</Button>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastError(generateModel('Error Toast'))}>Vertical - Error</Button>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastInfo(generateModel('Info Toast'))}>Vertical - Info</Button>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastSuccess(generateModel('Success Toast'))}>Vertical - Success</Button>
				{/*Top Down Buttons*/}
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastGeneral(generateModel('General Toast'))}>Top Down - General</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastError(generateModel('Error Toast'))}>Top Down - Error</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastInfo(generateModel('Info Toast'))}>Top Down - Info</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastSuccess(generateModel('Success Toast'))}>Top Down - Success</Button>
			</Grid>

			{/*Portals*/}
			<ToasterPortal_Vertical verticalPadding={8} verticalGap={8} modelFilter={model => model.key === 'ats-vertical'}/>
			<ToasterPortal_TopDown height={200} topOffset={8} modelFilter={model => model.key === 'ats-top-down'}/>
		</LL_H_C>;
	}
}

export const ATS_Toasting: AppToolsScreen = {
	key: 'ats__toasting',
	name: 'Toasting',
	renderer: ATS_Toasting_Class,
	group: thunderstormCapabilitiesGroup
};