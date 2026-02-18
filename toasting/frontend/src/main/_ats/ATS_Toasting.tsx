import {AppToolsScreen, Button, ComponentSync, LL_H_C} from '@nu-art/thunderstorm-frontend';
import {thunderstormCapabilitiesGroup} from '@nu-art/thunderstorm-frontend/consts';
import {ToasterPortal} from '../_ui/ToasterPortal/ToasterPortal.js';
import {Toaster} from '../_core/Toaster.js';

class ATS_Toasting_Class
	extends ComponentSync {

	private toaster = new Toaster();

	render() {
		return <LL_H_C className={'ats__toasting'}>
			<Button variant={'primary'} onClick={() => this.toaster.toastGeneral({body: 'General Test'})}>Toast General</Button>
			<ToasterPortal/>
		</LL_H_C>;
	}
}

export const ATS_Toasting: AppToolsScreen = {
	key: 'ats__toasting',
	name: 'Toasting',
	renderer: ATS_Toasting_Class,
	group: thunderstormCapabilitiesGroup
};