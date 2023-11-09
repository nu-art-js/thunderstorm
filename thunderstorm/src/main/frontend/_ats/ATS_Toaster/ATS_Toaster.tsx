import * as React from 'react';
import {ModuleFE_Toaster, ToastBuilder} from '../../component-modules/ModuleFE_Toaster';
import {TS_Toast} from '../../components/TS_Toaster';
import {ComponentSync} from '../../core';
import {AppToolsScreen} from '../../components/TS_AppTools';
import {LL_V_L} from '../../components/Layouts';
import {Minute} from '@nu-art/ts-common';


type ATS_Toaster_Props = {
	//
};
type ATS_Toaster_State = {
	//
};

export class ATS_Toaster
	extends ComponentSync<ATS_Toaster_Props, ATS_Toaster_State> {

	static screen: AppToolsScreen = {name: `DevTool - Toaster`, renderer: this};

	static defaultProps = {
		modules: [],
		pageTitle: () => this.screen.name
	};

	protected deriveStateFromProps(nextProps: ATS_Toaster_Props, state = {} as ATS_Toaster_State): ATS_Toaster_State | undefined {
		return undefined;
	}

	constructor(p: ATS_Toaster_Props) {
		super(p);
		// @ts-ignore
	}

	showAppToasterSuccessExample = () => {
		ModuleFE_Toaster.toastSuccess('Simple success message');
	};
	showToastForVeryLongTime = () => {
		ModuleFE_Toaster.toastSuccess('Simple success message', 6 * Minute);
	};

	showAppToasterErrorExample = () => {
		ModuleFE_Toaster.toastError('Simple error message');
	};

	showAppToasterInfoExample = () => {
		ModuleFE_Toaster.toastInfo('Simple info message');
	};

	showAppToasterCustomInfoExample = () => {
		ModuleFE_Toaster.toastInfo('Custom info message closes in 3 sec', 3000);
	};
	showAppToasterCustomErrorExample = () => {
		ModuleFE_Toaster.toastError('Custom Error message closes in 8 sec', 8000);
	};
	showAppToasterCustomSuccessExample = () => {
		new ToastBuilder().setContent(TS_Toast('is a very nice!', 'success')).show();
	};

	showAppToasterLiveDocsExample = () => {
		new ToastBuilder().setContent(TS_Toast('you spin me right \'round, baby, right \'round', 'success')).show();
	};

	render() {
		return <>
			<LL_V_L>
				<button style={{marginRight: 8}} onClick={this.showAppToasterSuccessExample}>Toaster Default Success Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterErrorExample}>Toaster Default Failure Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterInfoExample}>Toaster Default Info Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterLiveDocsExample}>Toaster Default Live Docs Example</button>
			</LL_V_L>
			<hr/>
			<LL_V_L>
				<button style={{marginRight: 8}} onClick={this.showToastForVeryLongTime}>Toaster for ever</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterCustomSuccessExample}>Toaster Custom Success Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterCustomErrorExample}>Toaster Custom Failure Example</button>
				<button style={{marginRight: 8}} onClick={this.showAppToasterCustomInfoExample}>Toaster Custom Info Example</button>
			</LL_V_L>
		</>;
	}
}