import {ReactNode} from 'react';
import {LL_H_C, LL_V_L} from '../../components/Layouts/index.js';
import {TS_AppTools} from '../../components/TS_AppTools/index.js';
import './ATS_Printable.scss';
import {TS_PropRenderer} from '../../components/TS_PropRenderer/index.js';
import {Button} from '../../components/Button/Button.js';
import {ModuleFE_Print} from '@nu-art/web-client//modules/ModuleFE_Print.js';
import {TS_Printable} from '../../components/TS_Printable/index.js';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {ComponentSync} from '@nu-art/thunder-utils/dist/components/ComponentSync.js';


type Created = {
	toPrintRef: ResolvableContent<ReactNode, [(ref: HTMLElement) => void]>
	toPrintNode: ResolvableContent<ReactNode>
};

export class ATS_AbstractPrintable
	extends ComponentSync<Created> {

	private printableRef1!: HTMLElement;
	private printableRef2!: HTMLElement;

	// static Screen: AppToolsScreen = {
	// 	key: 'ats-ts-printable',
	// 	name: 'Printable',
	// 	group: thunderstormCapabilitiesGroup,
	// 	renderer: this,
	// };
	//
	render() {
		return <LL_V_L id={'ats__printable'}>
			{TS_AppTools.renderPageHeader('Printable')}
			<LL_H_C className={'ats__printable__printables'}>
				{this.render_Printable1()}
				{this.render_Printable3()}
			</LL_H_C>
		</LL_V_L>;
	}

	private render_Printable1 = () => {
		return <TS_PropRenderer.Vertical label={'Same Content Printable'}>
			{resolveContent(this.props.toPrintRef, (ref) => this.printableRef1 = ref)}
			<Button
				variant={'primary'}
				onClick={async () => {
					const div = this.printableRef1;
					if (!div)
						return;

					await ModuleFE_Print.printElement(div);
				}}
			>Print</Button>
		</TS_PropRenderer.Vertical>;
	};

	private render_Printable3 = () => {
		return <TS_PropRenderer.Vertical label={'With TS Printable'}>
			<TS_Printable
				className={'ats__printable__printable-content-wrapper'}
				printable={async ref => {
					this.printableRef2 = ref;
				}}
			>
				{resolveContent(this.props.toPrintNode)}
			</TS_Printable>
			<Button
				variant={'primary'}
				onClick={() => ModuleFE_Print.printElement(this.printableRef2)}>Print</Button>
		</TS_PropRenderer.Vertical>;
	};

}