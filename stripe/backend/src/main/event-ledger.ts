import {currentTimeMillis, type Module} from '@nu-art/ts-common';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';

/**
 * Webhook idempotency: an event id is processed at most once to completion. Stripe retries
 * deliveries, so a claim that is not completed (crash, handler error) is released or expires.
 */
export interface StripeEventLedger {
	/** True when this caller now owns the event; false when it is done or claimed by someone else. */
	claim(eventId: string): Promise<boolean>;
	complete(eventId: string): Promise<void>;
	release(eventId: string): Promise<void>;
}

export type StripeEventRecord = { status: 'processing' | 'done'; at: number };

/** Decides a claim against the current record. Pure: shared by every ledger implementation. */
export const claimStripeEvent = (current: StripeEventRecord | null | undefined, now: number, leaseMs: number): StripeEventRecord | undefined => {
	if (current?.status === 'done')
		return undefined;

	if (current?.status === 'processing' && now - current.at < leaseMs)
		return undefined;

	return {status: 'processing', at: now};
};

/** Realtime Database ledger under the module state (`/state/<Module>/events/<eventId>`), claimed in a transaction. */
export class RtdbStripeEventLedger
	implements StripeEventLedger {

	constructor(private readonly module: Module, private readonly leaseMs: () => number) {
	}

	async claim(eventId: string): Promise<boolean> {
		let claimed = false;
		await this.ref(eventId).transaction((current: StripeEventRecord) => {
			const next = claimStripeEvent(current, currentTimeMillis(), this.leaseMs());
			claimed = !!next;
			return (next ?? undefined) as unknown as StripeEventRecord;
		});
		return claimed;
	}

	async complete(eventId: string): Promise<void> {
		await this.ref(eventId).set({status: 'done', at: currentTimeMillis()});
	}

	async release(eventId: string): Promise<void> {
		await this.ref(eventId).delete();
	}

	private ref(eventId: string) {
		return ModuleBE_Firebase.createModuleStateFirebaseRef<StripeEventRecord>(this.module, `events/${eventId.replace(/[.#$[\]/]/g, '_')}`);
	}
}
