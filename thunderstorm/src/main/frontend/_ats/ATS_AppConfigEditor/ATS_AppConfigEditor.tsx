import {ComponentSync} from '../../core/ComponentSync.js';
import {AppConfigKey_FE, DB_AppConfig, ModuleFE_AppConfig} from '../../_entity.js';
import {LL_H_C, LL_V_L} from '../../components/Layouts/index.js';
import {AppToolsScreen, TS_AppTools} from '../../components/TS_AppTools/index.js';
import {__stringify, exists, sortArray} from '@nu-art/ts-common';
import {_className} from '../../utils/tools.js';
import './ATS_AppConfigEditor.scss';
import {TS_JSONViewer} from '../../components/TS_JSONViewer/TS_JSONViewer.js';
import {TS_TextArea} from '../../components/TS_Input/index.js';
import { Button } from '../../components/Button/Button.js';

type Props = {
	appConfigFilter?: (appConfig: DB_AppConfig) => boolean;
};

type State = {
	configs: DB_AppConfig[];
	selectedKey?: string;
	dataString?: string;
}

export class ATS_AppConfigEditor
	extends ComponentSync<Props, State> {

	//######################### Static #########################

	static Screen = (props: Props): AppToolsScreen => ({
		key: 'app-config-editor',
		renderer: () => <ATS_AppConfigEditor {...props}/>,
		name: 'App Config Editor',
		group: 'Editors',
		modulesToAwait: [ModuleFE_AppConfig],
	});

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
		const allConfigs = !!nextProps.appConfigFilter
			? ModuleFE_AppConfig.cache.filter(nextProps.appConfigFilter)
			: ModuleFE_AppConfig.cache.allMutable();
		state.configs ??= sortArray(allConfigs, config => config.key);
		if (!state.selectedKey && state.configs.length) {
			const configKey = new AppConfigKey_FE(state.configs[0].key);
			state.selectedKey ??= configKey.key;
			state.dataString = this.resolveDataString(configKey.get());
		}
		return state;
	}

	//######################### Logic #########################

	private getConfigKey(key?: string) {
		if (!key)
			return;

		return new AppConfigKey_FE(key);
	}

	private resolveDataString(data: any) {
		return __stringify({data: data}, true);
	}

	private selectConfig = (config: DB_AppConfig) => {
		const configKey = this.getConfigKey(config.key);
		const dataString = this.resolveDataString(config.data);
		this.setState({selectedKey: configKey?.key, dataString});
	};

	private saveData = async (data: { data: any }) => {
		const selectedKey = this.state.selectedKey;
		if (!selectedKey)
			return;
		const configKey = new AppConfigKey_FE(selectedKey);
		await configKey.set(data.data);
	};

	//######################### Render #########################

	render() {
		return <LL_V_L id={'ats__app-config-editor'}>
			{TS_AppTools.renderPageHeader('App Config Editor')}
			<LL_H_C className={'app-config-editor__main'}>
				{this.render_AppConfigList()}
				{this.render_Editor()}
			</LL_H_C>
		</LL_V_L>;
	}

	private render_AppConfigList = () => {
		const selectedKey = this.state.selectedKey;
		return <LL_V_L className={'app-config-editor__config-list'}>
			{this.state.configs.map(config => {
				const className = _className('app-config-editor__config-list__config', config.key === selectedKey && 'selected');
				return <div
					key={config._id}
					className={className}
					onClick={() => this.selectConfig(config)}
				>{config.key}</div>;
			})}
		</LL_V_L>;
	};

	//######################### Render - Editor #########################

	private render_Editor = () => {
		const selectedKey = this.state.selectedKey;
		const config = this.state.configs.find(config => config.key === selectedKey);
		if (!config)
			return;

		return <LL_V_L className={'app-config-editor__editor'}>
			<div className={'app-config-editor__editor__title'}>{config.key}</div>
			<LL_H_C className={'app-config-editor__editor__views'}>
				<TS_JSONViewer item={config}/>
				{this.render_Editor_DataEditor()}
			</LL_H_C>
		</LL_V_L>;
	};

	private render_Editor_DataEditor = () => {
		const dataString = this.state.dataString;
		let dataObject: Object | undefined = undefined;
		let error: SyntaxError | undefined = undefined;
		if (!dataString)
			return;

		try {
			dataObject = JSON.parse(dataString);
		} catch (e: any) {
			error = e as SyntaxError;
		}

		return <LL_V_L className={'app-config-editor__editors'}>
			<TS_TextArea type={'text'} value={dataString} onChange={value => this.setState({dataString: value})}/>
			{exists(dataObject) && <TS_JSONViewer item={dataObject}/>}
			{exists(error) && <p className={'app-config-editor__error'}>{error.message}</p>}
			<Button disabled={exists(error)} onClick={() => this.saveData(dataObject as { data: any })}>Save Data</Button>
		</LL_V_L>;
	};
}