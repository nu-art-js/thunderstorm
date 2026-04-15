import * as React from 'react';
import {ComponentSync, LL_V_L, VirtualizedList} from '@nu-art/thunder-widgets';
import {SearchResult} from '../../../_core/SearchAddOn.js';
import {SearchItem} from '../../../_core/SearchItem.js';
import {SearchContext, SearchResultsRenderer} from '../../../_core/SearchContext.js';
import './Component_SearchResults.scss';
import {filterInstances, ResolvableContent} from '@nu-art/ts-common';

type Props = {
	context: SearchContext;
	itemHeight: number;
	maxItemsOnScreen: number;
};

type State = {
	searchResults?: SearchResult[];
	maxHeight: number;
};

export class Component_SearchResults
	extends ComponentSync<Props, State>
	implements SearchResultsRenderer {

	protected override deriveStateFromProps(nextProps: Props, state: State) {
		state.maxHeight = nextProps.maxItemsOnScreen * nextProps.itemHeight;
		return state;
	}

	__onSearchResultsChanged = () => {
		this.setState({searchResults: this.props.context.getSearchResults()});
	};

	override componentDidMount() {
		this.props.context.searchResultChangeListeners.register(this);
	}

	override componentWillUnmount() {
		this.props.context.searchResultChangeListeners.unregister(this);
	}

	private getList = (): ResolvableContent<React.ReactNode>[] => {
		if (!this.state.searchResults?.length)
			return [];

		const activeSearchItemMap = this.props.context.getActiveSearchItems().reduce((map, item) => {
			map[item.module.config.dbKey] = item;
			return map;
		}, {} as { [key: string]: SearchItem<any, any> });

		return filterInstances(this.state.searchResults.map(result => {
			const item = activeSearchItemMap[result.dbKey];
			if (!item)
				return;
			return (style?: React.CSSProperties) => item.resultRenderer(result, style);
		}));
	};

	override render() {
		if (!this.state.searchResults?.length)
			return this.render_NoResults();

		const list = this.getList();
		const height = Math.min(list.length * this.props.itemHeight, this.state.maxHeight);
		return <VirtualizedList
			className={'c__search-results'}
			width={0}
			height={height}
			itemHeight={this.props.itemHeight}
			listToRender={list}
			omitWrapper
		/>;
	}

	private render_NoResults = () => {
		return <LL_V_L className={'c__search-results no-results'}>
			No results to show
		</LL_V_L>;
	};
}
