import * as React from 'react';
import './ATS_Printable.scss';
import {Button, ComponentSync, LL_H_C, LL_V_L, TS_Printable, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {AppToolsScreen} from '../TS_AppTools/types.js';
import {generateArray} from '@nu-art/ts-common';
import {TS_AppTools} from '../TS_AppTools/index.js';
import {ModuleFE_Print} from '../modules/ModuleFE_Print.js';


export class ATS_Printable
	extends ComponentSync {

	private readonly sameContentRef = React.createRef<HTMLDivElement>();
	private printableRef!: HTMLDivElement;

	static Screen: AppToolsScreen = {
		key: 'ats-ts-printable',
		name: 'Printable',
		group: 'ui',
		renderer: this,
	};

	render() {
		return <LL_V_L id={'ats__printable'}>
			{TS_AppTools.renderPageHeader('Printable')}
			<LL_H_C className={'ats__printable__printables'}>
				{this.render_Printable1()}
				{this.render_Printable2()}
				{this.render_Printable3()}
			</LL_H_C>
		</LL_V_L>;
	}

	private render_Printable1 = () => {
		return <TS_PropRenderer.Vertical label={'Same Content Printable'}>
			<div className={'ats__printable__printable-content-wrapper'} ref={this.sameContentRef}>
				Expect to see this text in the print dialog!
				{generateArray(2, id => <img key={id} src={`https://picsum.photos/id/${id}/200/300`} alt={''}/>)}
			</div>
			<Button
				variant={'primary'}
				onClick={async () => {
					const div = this.sameContentRef.current;
					if (!div)
						return;

					await ModuleFE_Print.printElement(div);
				}}
			>Print</Button>
		</TS_PropRenderer.Vertical>;
	};

	private render_Printable2 = () => {
		return <TS_PropRenderer.Vertical label={'Different Content Printable'}>
			<div className={'ats__printable__printable-content-wrapper'}>
				Expect to see something else in the print dialog
			</div>
			<Button
				variant={'primary'}
				onClick={() => ModuleFE_Print.printNode(this.differentContentRenderer())}
			>Print</Button>
		</TS_PropRenderer.Vertical>;
	};

	private render_Printable3 = () => {
		return <TS_PropRenderer.Vertical label={'With TS Printable'}>
			<TS_Printable
				className={'ats__printable__printable-content-wrapper'}
				printable={async ref => {
					this.printableRef = ref;
				}}
			>
				Expect to see this text in the print dialog!
			</TS_Printable>
			<Button
				variant={'primary'}
				onClick={() => ModuleFE_Print.printElement(this.printableRef)}>Print</Button>
		</TS_PropRenderer.Vertical>;
	};

	private differentContentRenderer = () => {
		const urls = generateArray(200, id => <img key={id} src={`https://picsum.photos/id/${id}/200/300`} alt={''}/>);
		return <LL_V_L>{urls}</LL_V_L>;
	};
}