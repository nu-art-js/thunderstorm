import {AppToolsScreen, Button, ComponentSync, LL_H_C} from '@nu-art/thunderstorm-frontend';
import {thunderstormCapabilitiesGroup} from '@nu-art/thunderstorm-frontend/consts';
import {Toaster} from '../_core/Toaster.js';
import {ToasterPortal_Vertical} from '../_ui/ToasterPortal/index.js';
import './ATS_Toasting.scss';
import {ToastProperties} from '../_core/types.js';
import {generateHex} from '@nu-art/ts-common';

const generateModel = (title: string): ToastProperties => {
	const length = Math.floor(Math.random() * 150);
	return {
		title,
		body: generateHex(length)
	};
};

class ATS_Toasting_Class
	extends ComponentSync {

	private toaster = new Toaster('ATS');

	render() {
		return <LL_H_C className={'ats__toasting'}>
			<Button variant={'primary'} onClick={() => this.toaster.toastGeneral(generateModel('General Toast'))}>Toast General</Button>
			<Button variant={'primary'} onClick={() => this.toaster.toastError(generateModel('Error Toast'))}>Toast Error</Button>
			<Button variant={'primary'} onClick={() => this.toaster.toastInfo(generateModel('Info Toast'))}>Toast Info</Button>
			<Button variant={'primary'} onClick={() => this.toaster.toastSuccess(generateModel('Success Toast'))}>Toast Success</Button>
			<ToasterPortal_Vertical verticalPadding={8} verticalGap={8}/>
		</LL_H_C>;
	}
}

export const ATS_Toasting: AppToolsScreen = {
	key: 'ats__toasting',
	name: 'Toasting',
	renderer: ATS_Toasting_Class,
	group: thunderstormCapabilitiesGroup
};