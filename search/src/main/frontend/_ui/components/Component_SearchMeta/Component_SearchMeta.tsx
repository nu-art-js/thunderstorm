import * as React from 'react';
import {ComponentSync, LL_H_C} from '@nu-art/thunderstorm/frontend';
import {SearchContext, SearchResultsRenderer} from '../../../_core';
import './Component_SearchMeta.scss';

type Props = {
	context: SearchContext;
};

export class Component_SearchMeta
	extends ComponentSync<Props>
	implements SearchResultsRenderer {

	//######################### Life Cycle #########################

	__onSearchResultsChanged = () => {
		this.forceUpdate();
	};

	componentDidMount() {
		this.props.context.searchResultChangeListeners.register(this);
	}

	componentWillUnmount() {
		this.props.context.searchResultChangeListeners.unregister(this);
	}

	//######################### Render #########################

	render() {
		const searchResults = this.props.context.getSearchResults();
		if (!searchResults?.length)
			return;

		return <LL_H_C className={'c__search-meta'}>
			<div className={'c__search-meta__results'}>{searchResults.length} Results</div>
			{this.renderTime()}
		</LL_H_C>;
	}

	private renderTime = () => {
		const searchTime = this.props.context.getSearchTime();
		if (!searchTime)
			return;

		const str = searchTime >= 1000 ? `${searchTime / 1000}s` : `${searchTime}ms`;
		return <div className={'c__search-meta__time'}>{str}</div>;
	};
}