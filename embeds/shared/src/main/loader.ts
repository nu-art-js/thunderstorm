import {EmbedFrameMaxPx, EmbedFrameMinPx, EmbedResizeDeltaPx} from './frame-size.js';
import {EmbedMessageSource} from './types.js';

export type EmbedLoaderOptions = {
	/** Path on the embeds origin that renders a framed embed: `<framePath>?embed=<key>&token=<token>`. */
	framePath: string;
	/**
	 * Host pages on these origins are first-party: no iframe, the app bundle is loaded once and
	 * mounts the components into the placeholders directly (shared modules and state).
	 */
	firstPartyOrigins?: string[];
	/** The frontend bundle (ES module) loaded on first-party pages. */
	bundleUrl?: string;
};

/** Event the loader dispatches on document after the bundle is (or was already) loaded. */
export const EmbedScanEvent = 'ts-embed:scan';

/**
 * `/embed.js`. Placeholders on the host page:
 * `<div data-ts-embed="<key>" data-embed-token="<token>" data-embed-title="..."></div>`
 * (or the snippet form: the loader `<script>` itself carrying data-ts-embed / data-embed-token).
 * First-party origins get the bundle and a scan event; any other origin gets a sized iframe.
 */
export const embedLoaderJs = (options: EmbedLoaderOptions): string => {
	const config = JSON.stringify({
		framePath: options.framePath,
		firstParty: options.firstPartyOrigins ?? [],
		bundleUrl: options.bundleUrl ?? '',
		min: EmbedFrameMinPx,
		max: EmbedFrameMaxPx,
		delta: EmbedResizeDeltaPx,
		source: EmbedMessageSource,
		scanEvent: EmbedScanEvent,
	}).replace(/</g, '\\u003c');

	return `(function(){var C=${config};var self=document.currentScript;var embedOrigin='';try{embedOrigin=new URL(self&&self.src?self.src:'',document.baseURI).origin;}catch(e){}
if(!embedOrigin||embedOrigin==='null')return;
var firstParty=C.firstParty.indexOf(location.origin)>=0&&!!C.bundleUrl;
function loadBundle(){if(document.querySelector('script[data-ts-embed-bundle]')){document.dispatchEvent(new CustomEvent(C.scanEvent));return;}var s=document.createElement('script');s.type='module';s.src=new URL(C.bundleUrl,embedOrigin).toString();s.setAttribute('data-ts-embed-bundle','1');s.addEventListener('load',function(){document.dispatchEvent(new CustomEvent(C.scanEvent));});document.head.appendChild(s);}
function frame(el){var key=el.getAttribute('data-ts-embed')||'';var token=el.getAttribute('data-embed-token')||'';if(!key||!token)return;var iframe=document.createElement('iframe');iframe.title=el.getAttribute('data-embed-title')||key;iframe.src=embedOrigin+C.framePath+'?embed='+encodeURIComponent(key)+'&token='+encodeURIComponent(token);iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');iframe.style.cssText='width:100%;border:0;display:block;min-height:'+C.min+'px;max-height:'+C.max+'px;height:'+C.min+'px';
if(el.tagName==='SCRIPT')el.parentNode.insertBefore(iframe,el);else el.appendChild(iframe);var last=C.min;
window.addEventListener('message',function(e){if(e.origin!==embedOrigin||e.source!==iframe.contentWindow)return;var d=e.data;if(!d||d.source!==C.source||d.type!=='resize'||typeof d.height!=='number'||!isFinite(d.height)||d.height<0)return;var next=Math.min(C.max,Math.max(C.min,Math.ceil(d.height)));if(Math.abs(next-last)<C.delta)return;last=next;iframe.style.height=next+'px';});}
function scan(){var nodes=document.querySelectorAll('[data-ts-embed]');var needBundle=false;for(var i=0;i<nodes.length;i++){var el=nodes[i];if(el.getAttribute('data-ts-embed-mounted')==='1')continue;el.setAttribute('data-ts-embed-mounted','1');if(firstParty)needBundle=true;else frame(el);}if(needBundle)loadBundle();}
scan();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);})();`;
};

/** The snippet a site owner pastes. Attribute values are escaped. */
export const embedSnippet = (embedOrigin: string, key: string, token: string, title?: string): string => {
	const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const titleAttr = title?.trim() ? ` data-embed-title="${attr(title.trim())}"` : '';
	return `<script src="${attr(embedOrigin.replace(/\/$/, ''))}/embed.js" data-ts-embed="${attr(key)}" data-embed-token="${attr(token)}"${titleAttr} async></script>`;
};
