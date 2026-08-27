import {Button, ComponentSync, Grid, LL_H_C, Toaster, ToasterPortal_BottomUp, ToasterPortal_TopDown, ToasterPortal_Vertical, ToastProperties} from '@nu-art/thunder-widgets';
import {AppToolsScreen, ATS_Frontend} from '../TS_AppTools/types.js';
import './ATS_ToastingPlacement.scss';

const generateModel = (title: string): ToastProperties => ({
	title,
	body: `${title} — sample toast body for placement demo.`,
});

class ATS_ToastingPlacement_Class
	extends ComponentSync {

	private toaster_Vertical = new Toaster('ats-vertical');
	private toaster_TopDown = new Toaster('ats-top-down', 1000);
	private toaster_BottomUp = new Toaster('ats-bottom-up', 1000);

	render() {
		return <LL_H_C className={'ats__toasting'}>
			<Grid>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastGeneral(generateModel('General Toast'))}>Vertical - General</Button>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastError(generateModel('Error Toast'))}>Vertical - Error</Button>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastInfo(generateModel('Info Toast'))}>Vertical - Info</Button>
				<Button variant={'primary'} onClick={() => this.toaster_Vertical.toastSuccess(generateModel('Success Toast'))}>Vertical - Success</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastGeneral(generateModel('General Toast'))}>Top Down - General</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastError(generateModel('Error Toast'))}>Top Down - Error</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastInfo(generateModel('Info Toast'))}>Top Down - Info</Button>
				<Button variant={'primary'} onClick={() => this.toaster_TopDown.toastSuccess(generateModel('Success Toast'))}>Top Down - Success</Button>
				<Button variant={'primary'} onClick={() => this.toaster_BottomUp.toastGeneral(generateModel('General Toast'))}>Bottom Up - General</Button>
				<Button variant={'primary'} onClick={() => this.toaster_BottomUp.toastError(generateModel('Error Toast'))}>Bottom Up - Error</Button>
				<Button variant={'primary'} onClick={() => this.toaster_BottomUp.toastInfo(generateModel('Info Toast'))}>Bottom Up - Info</Button>
				<Button variant={'primary'} onClick={() => this.toaster_BottomUp.toastSuccess(generateModel('Success Toast'))}>Bottom Up - Success</Button>
			</Grid>

			<ToasterPortal_Vertical verticalPadding={8} verticalGap={8} modelFilter={model => model.key === 'ats-vertical'}/>
			<ToasterPortal_TopDown height={200} topOffset={8} modelFilter={model => model.key === 'ats-top-down'}/>
			<ToasterPortal_BottomUp height={200} bottomOffset={8} modelFilter={model => model.key === 'ats-bottom-up'}/>
		</LL_H_C>;
	}
}

export const ATS_ToastingPlacement: AppToolsScreen = {
	key: 'ats__toasting-placement',
	name: 'Toasting Placement',
	renderer: ATS_ToastingPlacement_Class,
	group: ATS_Frontend,
};
