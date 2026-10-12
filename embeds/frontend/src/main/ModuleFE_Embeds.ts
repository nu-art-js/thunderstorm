import {
	EmbedMessageSource,
	type EmbedResizeMessage,
	embedPostMessageTargets,
	EmbedScanEvent,
	nextEmbedFrameHeight
} from '@nu-art/embeds-shared';
import {Module} from '@nu-art/ts-common';

export type EmbedMountContext = {
	key: string;
	/** The signed token from the placeholder, when present; the component sends it to its APIs. */
	token?: string;
	/** Parsed `data-embed-props` JSON. */
	props: Record<string, unknown>;
};

/** Mounts a component into the element (e.g. React createRoot(element).render(...)); may return an unmount. */
export type EmbedMount = (element: HTMLElement, context: EmbedMountContext) => void | (() => void);

/**
 * Mounts registered components into `[data-ts-embed="<key>"]` placeholders of the host page (first-party,
 * no iframe), and reports content height when running inside a third-party frame.
 */
export class ModuleFE_Embeds_Class
	extends Module {

	private readonly components = new Map<string, EmbedMount>();
	private readonly unmounts = new Map<HTMLElement, () => void>();

	registerComponent(key: string, mount: EmbedMount) {
		this.components.set(key, mount);
	}

	protected init() {
		if (typeof document === 'undefined')
			return;

		document.addEventListener(EmbedScanEvent, () => this.scan());
		this.scan();
	}

	/** Mounts every not-yet-mounted placeholder with a registered component. Returns how many were mounted. */
	scan(root: ParentNode = document): number {
		let mounted = 0;
		root.querySelectorAll<HTMLElement>('[data-ts-embed]').forEach(placeholder => {
			if (placeholder.getAttribute('data-ts-embed-component') === '1')
				return;

			const key = placeholder.getAttribute('data-ts-embed') ?? '';
			const mount = this.components.get(key);
			if (!mount)
				return this.logWarning(`No component registered for embed '${key}'`);

			placeholder.setAttribute('data-ts-embed-component', '1');
			const target = placeholder.tagName === 'SCRIPT' ? this.containerBefore(placeholder) : placeholder;
			const unmount = mount(target, {key, token: placeholder.getAttribute('data-embed-token') ?? undefined, props: this.props(placeholder)});
			if (unmount)
				this.unmounts.set(target, unmount);

			mounted++;
		});
		return mounted;
	}

	unmountAll() {
		this.unmounts.forEach(unmount => unmount());
		this.unmounts.clear();
	}

	/**
	 * Inside a third-party frame: posts the content height to the parent (allowed origins only, never `*`),
	 * so the loader can size the iframe. Returns a stop function.
	 */
	startFrameResize(input: { root: HTMLElement; allowedOrigins: readonly string[] }): () => void {
		if (typeof window === 'undefined' || window.parent === window)
			return () => undefined;

		const targets = embedPostMessageTargets({referrer: document.referrer, allowedOrigins: input.allowedOrigins, selfOrigin: location.origin});
		let last: number | null = null;
		const post = () => {
			const rect = input.root.getBoundingClientRect();
			const next = nextEmbedFrameHeight(Math.max(input.root.scrollHeight, input.root.offsetHeight, rect.height), last);
			if (next === null)
				return;

			last = next;
			const message: EmbedResizeMessage = {source: EmbedMessageSource, type: 'resize', height: next};
			targets.forEach(target => window.parent.postMessage(message, target));
		};

		post();
		if (typeof ResizeObserver === 'undefined')
			return () => undefined;

		const observer = new ResizeObserver(post);
		observer.observe(input.root);
		return () => observer.disconnect();
	}

	private containerBefore(script: HTMLElement): HTMLElement {
		const container = document.createElement('div');
		container.setAttribute('data-ts-embed-host', script.getAttribute('data-ts-embed') ?? '');
		script.parentNode?.insertBefore(container, script);
		return container;
	}

	private props(placeholder: HTMLElement): Record<string, unknown> {
		const raw = placeholder.getAttribute('data-embed-props');
		if (!raw)
			return {};

		try {
			const value = JSON.parse(raw);
			return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
		} catch {
			this.logWarning('Ignoring malformed data-embed-props');
			return {};
		}
	}
}

export const ModuleFE_Embeds = new ModuleFE_Embeds_Class();
