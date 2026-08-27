import * as React from 'react';
import {LL_V_L} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_Theme} from '@nu-art/thunder-theme';
import {ComponentGrid} from '../ComponentGrid.js';
import {GallerySection} from '../GallerySection.js';
import {usePreviewInspect, PreviewInspectButton, PreviewInspectWrap} from '../PreviewInspect.js';
import {TokenEditor} from '../theme-editor/TokenEditor.js';
import {globalTokenGroups} from '../theme-editor/token-introspection.js';

export type ThemeEditorModeProps = {
	highlightToken?: string;
	highlightTokens?: string[];
	onHighlightToken: (token?: string) => void;
	onHighlightTokens: (tokens?: string[]) => void;
	onSelectComponent: (id: string) => void;
};

/** Theme level — global token editor + live component grid with inspect. */
export const ThemeEditorModeView: React.FC<ThemeEditorModeProps> = props => {
	const inspect = usePreviewInspect(props.onHighlightTokens);

	return (
		<LL_V_L className={'dl-mode dl-mode--theme-editor'}>
			<TokenEditor
				title={'Global tokens'}
				subtitle={`theme: ${ModuleFE_Theme.getCurrentTheme()}`}
				groups={globalTokenGroups()}
				highlightToken={props.highlightToken}
				highlightTokens={props.highlightTokens}
				onRefClick={token => props.onHighlightToken(token)}
				showControls
				layout={'global'}
				allowCreateGlobal
			/>
			<GallerySection
				wide
				title={'Live preview'}
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
					<ComponentGrid selectable onSelect={props.onSelectComponent}/>
				</PreviewInspectWrap>
			</GallerySection>
		</LL_V_L>
	);
};
