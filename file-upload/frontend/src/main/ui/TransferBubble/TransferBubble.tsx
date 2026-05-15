import {ComponentSync} from '@nu-art/thunder-widgets';
import {_className} from '@nu-art/thunder-core';
import {
	FileTransferPhase,
	FileTransferState,
	ModuleFE_FileUpload,
	OnFileTransferStateChanged,
	TransferDirection,
} from '../../modules/ModuleFE_FileUpload.js';
import './TransferBubble.scss';


type TransferBubbleProps = {};

type BrowseFilter = 'all' | 'done' | 'in-progress' | 'queued' | 'failed';

type TransferBubbleState = {
	files: Map<string, FileTransferState>
	trayOpen: boolean
	browseOpen: boolean
	browseFilter: BrowseFilter
	activeDirectionTab?: TransferDirection
	visible: boolean
};

const RingRadius = 18;
const RingCircumference = 2 * Math.PI * RingRadius;
const AutoHideDelayMs = 3000;

const ActivePhases_Upload: FileTransferPhase[] = ['uploading', 'confirming'];
const ActivePhases_Download: FileTransferPhase[] = ['preparing', 'downloading'];
const ActivePhases: FileTransferPhase[] = [...ActivePhases_Upload, ...ActivePhases_Download];
const QueuedPhase: FileTransferPhase = 'requesting';

export class TransferBubble
	extends ComponentSync<TransferBubbleProps, TransferBubbleState>
	implements OnFileTransferStateChanged {

	private autoHideTimer?: ReturnType<typeof setTimeout>;

	protected deriveStateFromProps(nextProps: TransferBubbleProps, state: TransferBubbleState): TransferBubbleState {
		state.files ??= new Map();
		state.trayOpen ??= false;
		state.browseOpen ??= false;
		state.browseFilter ??= 'all';
		state.visible ??= false;
		return state;
	}

	__onFileTransferStateChanged = (fileState: FileTransferState) => {
		const key = fileState.assetId ?? fileState.name;
		const files = new Map(this.state.files);
		files.set(key, {...fileState});

		this.clearAutoHideTimer();

		if (this.isAllDoneFrom(files))
			this.autoHideTimer = setTimeout(() => this.setState({visible: false, trayOpen: false}), AutoHideDelayMs);

		this.setState({files, visible: true});
	};

	private clearAutoHideTimer() {
		if (this.autoHideTimer) {
			clearTimeout(this.autoHideTimer);
			this.autoHideTimer = undefined;
		}
	}

	componentWillUnmount() {
		this.clearAutoHideTimer();
	}

	// ── Derived data ──

	private getFileList(direction?: TransferDirection): FileTransferState[] {
		const all = Array.from(this.state.files.values());
		if (!direction)
			return all;

		return all.filter(f => f.direction === direction);
	}

	private getDirections(): TransferDirection[] {
		const dirs = new Set<TransferDirection>();
		for (const f of this.state.files.values())
			dirs.add(f.direction);

		return Array.from(dirs);
	}

	private hasMultipleDirections(): boolean {
		return this.getDirections().length > 1;
	}

	private getActiveDirection(): TransferDirection | undefined {
		if (!this.hasMultipleDirections())
			return this.getDirections()[0];

		return this.state.activeDirectionTab ?? this.getDirections()[0];
	}

	private getActiveFiles(direction?: TransferDirection): FileTransferState[] {
		return this.getFileList(direction).filter(f => ActivePhases.includes(f.phase));
	}

	private getQueuedFiles(direction?: TransferDirection): FileTransferState[] {
		return this.getFileList(direction).filter(f => f.phase === QueuedPhase);
	}

	private getDoneFiles(direction?: TransferDirection): FileTransferState[] {
		return this.getFileList(direction).filter(f => f.phase === 'completed');
	}

	private getFailedFiles(direction?: TransferDirection): FileTransferState[] {
		return this.getFileList(direction).filter(f => f.phase === 'failed');
	}

	private getOverallProgress(direction?: TransferDirection): number {
		const files = this.getFileList(direction);
		if (!files.length)
			return 0;

		return files.reduce((sum, f) => sum + (f.phase === 'completed' ? 1 : f.progress), 0) / files.length;
	}

	private isAllDone(direction?: TransferDirection): boolean {
		return this.isAllDoneFrom(this.state.files, direction);
	}

	private isAllDoneFrom(files: Map<string, FileTransferState>, direction?: TransferDirection): boolean {
		const list = Array.from(files.values()).filter(f => !direction || f.direction === direction);
		return list.length > 0 && list.every(f => f.phase === 'completed' || f.phase === 'failed');
	}

	private getFilteredFiles(): FileTransferState[] {
		const dir = this.getActiveDirection();
		switch (this.state.browseFilter) {
			case 'done':
				return this.getDoneFiles(dir);
			case 'in-progress':
				return this.getActiveFiles(dir);
			case 'queued':
				return this.getQueuedFiles(dir);
			case 'failed':
				return this.getFailedFiles(dir);
			default:
				return this.getFileList(dir);
		}
	}

	private getCountForFilter(filter: BrowseFilter): number {
		const dir = this.getActiveDirection();
		switch (filter) {
			case 'done':
				return this.getDoneFiles(dir).length;
			case 'in-progress':
				return this.getActiveFiles(dir).length;
			case 'queued':
				return this.getQueuedFiles(dir).length;
			case 'failed':
				return this.getFailedFiles(dir).length;
			default:
				return this.getFileList(dir).length;
		}
	}

	// ── Labels ──

	private getHeaderLabel(): string {
		const dir = this.getActiveDirection();
		const allDone = this.isAllDone(dir);
		const hasErrors = this.getFailedFiles(dir).length > 0;

		if (allDone)
			return hasErrors ? `${this.getDirectionVerb(dir)} completed with errors` : `All files ${this.getDirectionPastTense(dir)}`;

		return `${this.getDirectionGerund(dir)} files`;
	}

	private getDirectionVerb(direction?: TransferDirection): string {
		switch (direction) {
			case 'upload':
				return 'Upload';
			case 'download':
				return 'Download';
			default:
				return 'Transfer';
		}
	}

	private getDirectionGerund(direction?: TransferDirection): string {
		switch (direction) {
			case 'upload':
				return 'Uploading';
			case 'download':
				return 'Downloading';
			default:
				return 'Transferring';
		}
	}

	private getDirectionPastTense(direction?: TransferDirection): string {
		switch (direction) {
			case 'upload':
				return 'uploaded';
			case 'download':
				return 'downloaded';
			default:
				return 'transferred';
		}
	}

	private getPhaseLabel(phase: FileTransferPhase): string {
		switch (phase) {
			case 'requesting':
				return 'Queued';
			case 'uploading':
				return 'Uploading';
			case 'confirming':
				return 'Validating';
			case 'preparing':
				return 'Preparing';
			case 'downloading':
				return 'Downloading';
			case 'completed':
				return 'Done';
			case 'failed':
				return 'Failed';
		}
	}

	// ── Actions ──

	private readonly toggleTray = () => {
		this.clearAutoHideTimer();
		this.setState({trayOpen: !this.state.trayOpen, browseOpen: false});
	};

	private readonly openBrowse = () => {
		this.setState({browseOpen: true, browseFilter: 'all'});
	};

	private readonly closeBrowse = () => {
		this.setState({browseOpen: false});
	};

	private readonly setBrowseFilter = (filter: BrowseFilter) => {
		this.setState({browseFilter: filter});
	};

	private readonly setDirectionTab = (direction: TransferDirection) => {
		this.setState({activeDirectionTab: direction, browseFilter: 'all'});
	};

	private readonly retryFile = (fileState: FileTransferState) => {
		if (!fileState.assetId)
			return;

		const files = new Map(this.state.files);
		files.delete(fileState.assetId);
		this.setState({files});

		if (fileState.direction === 'upload')
			ModuleFE_FileUpload.retryUpload(fileState.assetId);
		else
			ModuleFE_FileUpload.retryDownload(fileState.assetId, fileState.name);
	};

	// ── Render ──

	render() {
		if (!this.state.visible)
			return null;

		return <div className="ts-transfer-bubble">
			{this.renderFab()}
			{this.state.trayOpen && (this.state.browseOpen ? this.renderBrowseOverlay() : this.renderTray())}
		</div>;
	}

	private renderFab() {
		const progress = this.getOverallProgress();
		const activeCount = this.getActiveFiles().length;
		const allDone = this.isAllDone();
		const hasErrors = this.getFailedFiles().length > 0;
		const offset = RingCircumference * (1 - progress);
		const directions = this.getDirections();

		let icon: string;
		if (allDone)
			icon = '✓';
		else if (directions.length > 1)
			icon = '⇅';
		else if (directions[0] === 'download')
			icon = '↓';
		else
			icon = '↑';

		return <button
			className={_className('ts-transfer-bubble__fab', allDone && 'ts-transfer-bubble__fab--done', hasErrors && 'ts-transfer-bubble__fab--error')}
			onClick={this.toggleTray}
		>
			<svg className="ts-transfer-bubble__fab-ring" viewBox="0 0 44 44">
				<circle className="ts-transfer-bubble__fab-ring-bg" cx="22" cy="22" r={RingRadius}/>
				<circle
					className="ts-transfer-bubble__fab-ring-progress"
					cx="22" cy="22" r={RingRadius}
					strokeDasharray={RingCircumference}
					strokeDashoffset={offset}
				/>
			</svg>
			<span className="ts-transfer-bubble__fab-icon">{icon}</span>
			{activeCount > 0 && <span className="ts-transfer-bubble__fab-badge">{activeCount}</span>}
		</button>;
	}

	private renderTray() {
		const dir = this.getActiveDirection();

		return <div className="ts-transfer-bubble__tray">
			{this.renderDirectionTabs()}
			{this.renderHeader()}
			{this.renderOverallProgress(dir)}
			{this.renderErrorSection(dir)}
			{this.renderTicker(dir)}
			{this.renderSummaryBar(dir)}
			{this.renderDoneBanner(dir)}
			{this.renderFooter()}
		</div>;
	}

	// ── Direction tabs ──

	private renderDirectionTabs() {
		if (!this.hasMultipleDirections())
			return null;

		const active = this.getActiveDirection();
		return <div className="ts-transfer-bubble__dir-tabs">
			{this.getDirections().map(dir => <button
				key={dir}
				className={_className('ts-transfer-bubble__dir-tab', active === dir && 'ts-transfer-bubble__dir-tab--active')}
				onClick={() => this.setDirectionTab(dir)}
			>
				{dir === 'upload' ? 'Uploads' : 'Downloads'} ({this.getFileList(dir).length})
			</button>)}
		</div>;
	}

	// ── Header ──

	private renderHeader() {
		const dir = this.getActiveDirection();
		const allDone = this.isAllDone(dir);
		const hasErrors = this.getFailedFiles(dir).length > 0;
		const label = this.getHeaderLabel();
		const pillClass = _className(
			'ts-transfer-bubble__header-pill',
			allDone && !hasErrors && 'ts-transfer-bubble__header-pill--done',
			hasErrors && 'ts-transfer-bubble__header-pill--error',
		);

		return <div className="ts-transfer-bubble__header">
			<span className={pillClass}/>
			<span className="ts-transfer-bubble__header-title">{label}</span>
		</div>;
	}

	// ── Overall progress ──

	private renderOverallProgress(direction?: TransferDirection) {
		const progress = this.getOverallProgress(direction);
		const pct = Math.round(progress * 100);
		const active = this.getActiveFiles(direction).length;
		const done = this.getDoneFiles(direction).length;
		const failed = this.getFailedFiles(direction).length;
		const queued = this.getQueuedFiles(direction).length;

		return <div className="ts-transfer-bubble__progress">
			<div className="ts-transfer-bubble__progress-bar">
				<div className="ts-transfer-bubble__progress-bar-fill" style={{width: `${pct}%`}}/>
			</div>
			<div className="ts-transfer-bubble__progress-stats">
				<span>{pct}%</span>
				<span>{active} active</span>
				<span>{done} done</span>
				{failed > 0 && <span className="ts-transfer-bubble__progress-stats--failed">{failed} failed</span>}
				{queued > 0 && <span>{queued} queued</span>}
			</div>
		</div>;
	}

	// ── Error section (pinned) ──

	private renderErrorSection(direction?: TransferDirection) {
		const failedFiles = this.getFailedFiles(direction);
		if (!failedFiles.length)
			return null;

		return <div className="ts-transfer-bubble__errors">
			<div className="ts-transfer-bubble__errors-header">
				<span className="ts-transfer-bubble__errors-icon">⚠</span>
				<span>{failedFiles.length} failed</span>
			</div>
			<div className="ts-transfer-bubble__errors-list">
				{failedFiles.map((f, i) => <div key={f.assetId ?? i} className="ts-transfer-bubble__errors-item">
					<span className="ts-transfer-bubble__errors-item-name">{f.name}</span>
					<span className="ts-transfer-bubble__errors-item-reason">{f.error ?? 'Unknown error'}</span>
					<button className="ts-transfer-bubble__errors-item-retry" onClick={() => this.retryFile(f)}>Retry</button>
				</div>)}
			</div>
		</div>;
	}

	// ── Ticker (3-slot view of active transfers) ──

	private renderTicker(direction?: TransferDirection) {
		const active = this.getActiveFiles(direction);
		if (!active.length && !this.getQueuedFiles(direction).length)
			return null;

		const tickerSlots = active.slice(0, 3);

		return <div className="ts-transfer-bubble__ticker">
			{tickerSlots.map((f, i) => {
				const pct = Math.round(f.progress * 100);
				return <div key={f.assetId ?? i} className="ts-transfer-bubble__ticker-item">
					<span className="ts-transfer-bubble__ticker-item-name">{f.name}</span>
					<div className="ts-transfer-bubble__ticker-item-bar">
						<div className="ts-transfer-bubble__ticker-item-bar-fill" style={{width: `${pct}%`}}/>
					</div>
					<span className="ts-transfer-bubble__ticker-item-pct">{pct}%</span>
				</div>;
			})}
		</div>;
	}

	// ── Summary bar ──

	private renderSummaryBar(direction?: TransferDirection) {
		const done = this.getDoneFiles(direction).length;
		const queued = this.getQueuedFiles(direction).length;
		const total = this.getFileList(direction).length;

		if (!total)
			return null;

		return <div className="ts-transfer-bubble__summary" onClick={this.openBrowse}>
			<span>{done}/{total} completed</span>
			{queued > 0 && <span>{queued} in queue</span>}
			<span className="ts-transfer-bubble__summary-browse">Browse all</span>
		</div>;
	}

	// ── Done banner ──

	private renderDoneBanner(direction?: TransferDirection) {
		if (!this.isAllDone(direction))
			return null;

		const failed = this.getFailedFiles(direction).length;
		const total = this.getFileList(direction).length;
		const succeeded = total - failed;
		const pastTense = this.getDirectionPastTense(direction);

		return <div className={_className('ts-transfer-bubble__done-banner', failed > 0 && 'ts-transfer-bubble__done-banner--partial')}>
			{failed > 0
				? <span>{succeeded}/{total} files {pastTense} — {failed} failed</span>
				: <span>All {total} files {pastTense} successfully</span>}
		</div>;
	}

	// ── Footer ──

	private renderFooter() {
		if (this.isAllDone())
			return null;

		return <div className="ts-transfer-bubble__footer">
			<button className="ts-transfer-bubble__footer-cancel" onClick={() => {
				ModuleFE_FileUpload.cancelAll();
				this.setState({visible: false, trayOpen: false, files: new Map()});
			}}>
				Cancel all
			</button>
		</div>;
	}

	// ── Browse overlay ──

	private renderBrowseOverlay() {
		const allFilters: BrowseFilter[] = ['all', 'done', 'in-progress', 'queued', 'failed'];
		const visibleFilters = allFilters.filter(f => this.getCountForFilter(f) > 0);
		const filteredFiles = this.getFilteredFiles();

		return <div className="ts-transfer-bubble__tray ts-transfer-bubble__browse">
			<div className="ts-transfer-bubble__browse-header">
				{this.renderDirectionTabs()}
				<span className="ts-transfer-bubble__browse-title">All files</span>
				<button className="ts-transfer-bubble__browse-close" onClick={this.closeBrowse}>✕</button>
			</div>
			{visibleFilters.length > 1 && <div className="ts-transfer-bubble__browse-filters">
				{visibleFilters.map(filter => <button
					key={filter}
					className={_className('ts-transfer-bubble__browse-filter', this.state.browseFilter === filter && 'ts-transfer-bubble__browse-filter--active')}
					onClick={() => this.setBrowseFilter(filter)}
				>
					{filter} ({this.getCountForFilter(filter)})
				</button>)}
			</div>}
			<div className="ts-transfer-bubble__browse-list">
				{filteredFiles.map((f, i) => <div key={f.assetId ?? i} className="ts-transfer-bubble__browse-item">
					<span className="ts-transfer-bubble__browse-item-name">{f.name}</span>
					<span className={_className('ts-transfer-bubble__browse-item-status', `ts-transfer-bubble__browse-item-status--${f.phase}`)}>
						{this.getPhaseLabel(f.phase)}
					</span>
					{ActivePhases.includes(f.phase) && <span className="ts-transfer-bubble__browse-item-pct">{Math.round(f.progress * 100)}%</span>}
					{f.phase === 'failed' && <span className="ts-transfer-bubble__browse-item-error">{f.error}</span>}
				</div>)}
				{!filteredFiles.length && <div className="ts-transfer-bubble__browse-empty">No files match this filter</div>}
			</div>
		</div>;
	}
}
