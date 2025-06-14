import {ComponentSync} from '../../core/ComponentSync';
import {ModuleFE_Dialog} from '../../component-modules/ModuleFE_Dialog';
import {LL_H_C, LL_V_L} from '../../components/Layouts';
import {TS_Icons} from '@nu-art/ts-styles';
import {Component_CollectionGrid} from './Component_CollectionGrid';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ResolvableContent, RuntimeModules, exists, resolveContent} from '@nu-art/ts-common';
import './Dialog_IDBCacheComparison.scss';
import {DefaultProps} from '../../utils/types';

type Props = {
	modules: ResolvableContent<ModuleFE_BaseDB<any>[]>;
};

type State = {};

export class Dialog_IDBCacheComparison
	extends ComponentSync<Props, State> {

	static defaultProps: DefaultProps<Dialog_IDBCacheComparison> = {
		modules: () => RuntimeModules().filter(module => exists(module.dbDef?.dbKey)) as ModuleFE_BaseDB<any>[],
	};

	static show = (props?: Props) => {
		ModuleFE_Dialog.show({
			content: <Dialog_IDBCacheComparison {...props}/>,
		});
	};

	render() {
		return <LL_V_L id={'dialog__idb-cache-comp'}>
			{this.render_Header()}
			{this.render_Grid()}
		</LL_V_L>;
	}

	private render_Header = () => {
		return <LL_H_C className={'dialog__idb-cache-comp__header'}>
			<div className={'dialog__idb-cache-comp__header__title'}>{'IDB <-> Cache Comparison'}</div>
			<TS_Icons.x.component onClick={() => {
				ModuleFE_Dialog.close();
			}}/>
		</LL_H_C>;
	};

	private render_Grid = () => {
		const modules = resolveContent(this.props.modules);
		return <div className={'dialog__idb-cache-comp__grid-wrapper'}>
			<Component_CollectionGrid modules={modules}/>
		</div>
	}
}