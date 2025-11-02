let _dt = 0;
export const TimeProxy = Object.freeze({
	getDelta: () => _dt,
	setDelta: (dt: number) => _dt = dt,
	setVirtualTime: (timestamp: number) => TimeProxy.setDelta(timestamp - TimeProxy.getRealTime()),
	currentTimeMillis: () => TimeProxy.getRealTime() + _dt,
	getRealTime: () => Date.now(),
	reset: () => _dt = 0,
});
