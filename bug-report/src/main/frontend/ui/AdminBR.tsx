/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {AdminBRModule, RequestKey_GetLog} from '../modules/AdminBRModule';
import {ComponentSync,} from '@nu-art/thunderstorm/frontend';
import {DB_BugReport} from '../../shared/api';
import {__stringify} from '@nu-art/ts-common';
import {OnRequestListener} from '@nu-art/thunderstorm';

export class AdminBR
	extends ComponentSync
	implements OnRequestListener {

	protected deriveStateFromProps(nextProps: any) {
		return {...nextProps};
	}

	render() {
		const logs = AdminBRModule.getLogs();
		return (
			<div>
				<button onClick={() => AdminBRModule.v1.retrieveLogs({}).execute()}>click to display logs</button>
				<div>
					<table style={{width: '100%'}}>{logs.map(this.createRow)}</table>
				</div>
			</div>
		);
	}

	private createRow = (report: DB_BugReport) => <tr>
		<td style={{padding: '15px', textAlign: 'left', border: '1px solid #ddd', fontSize: '15px'}}>{report.description}</td>
		<td style={{padding: '15px', textAlign: 'left', border: '1px solid #ddd', fontSize: '15px'}}>{report.reports[0].path}</td>
		<td style={{padding: '15px', textAlign: 'left', border: '1px solid #ddd', fontSize: '15px'}}>{__stringify(report.tickets)}</td>
		<td style={{padding: '15px', textAlign: 'left', border: '1px solid #ddd', fontSize: '15px'}}>
			<button onClick={() => AdminBRModule.downloadMultiLogs(report.reports)}>download</button>
		</td>
	</tr>;

	__onRequestCompleted = (key: string, success: boolean) => {
		switch (key) {
			default:
				return;

			case RequestKey_GetLog:
				this.forceUpdate();
		}
	};
}
