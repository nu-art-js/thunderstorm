import * as React from 'react';
import {useEffect, useState} from 'react';
import {LL_V_L} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_Theme} from '@nu-art/thunder-theme';
import {ComponentPreviews} from '../registry.js';
import {GallerySection} from '../GallerySection.js';
import {usePreviewInspect, PreviewInspectButton, PreviewInspectWrap} from '../PreviewInspect.js';
import {TokenEditor} from '../theme-editor/TokenEditor.js';
import {
	componentTokenGroups,
	globalTokenGroups,
	referencedGlobalsForComponent,
	TokenLinkMode
} from '../theme-editor/token-introspection.js';

export type ComponentEditorModeProps = {
	componentId: string;
	highlightToken?: string;
	highlightTokens?: string[];
	onHighlightToken: (token?: string) => void;
	onHighlightTokens: (tokens?: string[]) => void;
};

/** Mode 3 — component token editor above, single component preview below. */
export const ComponentEditorMode: React.FC<ComponentEditorModeProps> = props => {
	const preview = ComponentPreviews.find(p => p.id === props.componentId);
	const inspect = usePreviewInspect(props.onHighlightTokens);
	const [linkMode, setLinkMode] = useState<TokenLinkMode | undefined>();
	const [, setTick] = useState(0);
	const refresh = () => setTick(tick => tick + 1);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape')
				setLinkMode(undefined);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	if (!preview)
		return null;

	const Renderer = preview.renderer;

	const startLink = (componentToken: string, requiredKind: TokenLinkMode['requiredKind']) => {
		setLinkMode({componentToken, requiredKind});
	};

	const completeLink = (globalToken: string) => {
		if (!linkMode)
			return;
		ModuleFE_Theme.setOverride(linkMode.componentToken, `var(${globalToken})`);
		setLinkMode(undefined);
		refresh();
	};

	const linkSubtitle = linkMode
		? `Linking ${linkMode.componentToken.replace(/^--/, '')} — pick a matching global on the right (Esc to cancel)`
		: 'Maps to a global — use the link icon to change it';

	return (
		<LL_V_L className={'dl-mode dl-mode--component-editor'}>
			<div className={'dl-mode__editor-row'}>
				<TokenEditor
					title={`${preview.title} tokens`}
					subtitle={linkSubtitle}
					groups={componentTokenGroups(props.componentId)}
					componentSlot
					linkMode={linkMode}
					onStartLink={startLink}
					highlightToken={props.highlightToken}
					highlightTokens={props.highlightTokens}
					onRefClick={token => props.onHighlightToken(token)}
				/>
				<TokenEditor
					title={'Referenced globals'}
					subtitle={linkMode ? undefined : 'Globals this component points to — edit values here'}
					groups={linkMode ? globalTokenGroups() : referencedGlobalsForComponent(props.componentId)}
					highlightToken={props.highlightToken}
					highlightTokens={props.highlightTokens}
					layout={'global-2col'}
					showControls
					allowCreateGlobal
					linkMode={linkMode}
					onCompleteLink={completeLink}
					onCancelLink={() => setLinkMode(undefined)}
					onRuntimeChange={refresh}
				/>
			</div>

			<GallerySection
				fitContent
				title={`${preview.title} — under test`}
				headerActions={(
					<PreviewInspectButton
						inspectMode={inspect.inspectMode}
						inspectHint={inspect.inspectHint}
						onToggle={inspect.toggleInspect}
					/>
				)}
			>
				<PreviewInspectWrap
					inspectMode={inspect.inspectMode}
					boundaryRef={inspect.boundaryRef}
					onInspectClick={inspect.onInspectClick}
				>
					<Renderer/>
				</PreviewInspectWrap>
			</GallerySection>
		</LL_V_L>
	);
};
