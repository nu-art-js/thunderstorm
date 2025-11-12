import * as React from 'react';
import {ComponentSync, VirtualizedList} from '@nu-art/thunderstorm/frontend';
import {SearchContext, SearchItem, SearchResultsRenderer} from '../../../_core';
import './Component_SearchResults.scss';
import {DBPointer, filterInstances, ResolvableContent} from '@nu-art/ts-common';

type Props = {
	context: SearchContext;
	itemHeight: number;
	maxItemsOnScreen: number;
};

type State = {
	searchResults?: DBPointer[];
	maxHeight: number;
};

export class Component_SearchResults
	extends ComponentSync<Props, State>
	implements SearchResultsRenderer {

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.maxHeight = nextProps.maxItemsOnScreen * nextProps.itemHeight;
		return state;
	}

	__onSearchResultsChanged = () => {
		this.setState({searchResults: this.props.context.getSearchResults()});
	};

	componentDidMount() {
		this.props.context.searchResultChangeListeners.register(this);
	}

	componentWillUnmount() {
		this.props.context.searchResultChangeListeners.unregister(this);
	}

	//######################### Render #########################

	private getList = (): ResolvableContent<React.ReactNode>[] => {
		if (!this.state.searchResults?.length)
			return [];

		const activeSearchItemMap = this.props.context.getActiveSearchItems().reduce((map, item) => {
			map[item.module.dbDef.dbKey] = item;
			return map;
		}, {} as { [key: string]: SearchItem<any, any> });

		return filterInstances(this.state.searchResults.map(result => {
			const item = activeSearchItemMap[result.dbKey];
			if (!item)
				return;

			return (style?: React.CSSProperties) => item.resultRenderer(result, style);
		}));
	};

	//######################### Render #########################

	render() {
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
}