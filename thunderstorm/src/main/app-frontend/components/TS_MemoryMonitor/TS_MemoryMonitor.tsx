/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import './TS_MemoryMonitor.scss';

class MemoryMonitor
	extends React.Component<any, any> {
	private id!: any;

	componentDidMount() {
		this.id = setInterval(() => {
			this.forceUpdate();
		}, 1000);

	}

	componentWillUnmount() {
		clearInterval(this.id);
	}

	render() {

		// @ts-ignore
		const mem: ChromeMem = window.performance.memory;
		if (!mem)
			return '';

		return <div>{Math.round(mem.usedJSHeapSize / 1024 / 1024)} / {Math.round(mem.totalJSHeapSize / 1024 / 1024)}mb</div>;
	}
}

export const TS_MemoryMonitor = () => {
	return <div className="ts-memory-monitor">
		<div className="ts-memory-monitor__version">{`${process.env.appEnv}-${process.env.appVersion}`}</div>
		<MemoryMonitor/>
	</div>;
};

