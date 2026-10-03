/**
 * Shared WebUSB helpers for receipt and label printers: find and claim the bulk-OUT endpoint, send data in
 * 4 KB chunks, and a tiny event emitter for hardware status.
 */
/** Shared WebUSB helpers for receipt printers and label printers. */

export function findUsbOutput(device) {
	const configuration = device.configuration || (device.configurations || [])[0];
	if (!configuration) return null;
	for (const iface of configuration.interfaces)
		for (const alternate of iface.alternates)
			for (const endpoint of alternate.endpoints)
				if (endpoint.direction === "out" && endpoint.type === "bulk")
					return {
						configurationValue: configuration.configurationValue,
						interfaceNumber: iface.interfaceNumber,
						alternateSetting: alternate.alternateSetting,
						endpointNumber: endpoint.endpointNumber,
					};
	return null;
}

/** Opens the device and claims its bulk-OUT interface. Returns the endpoint info. */
export async function claimUsbOutput(device, label = "USB device") {
	if (!device.opened) await device.open();
	let output = findUsbOutput(device);
	if (!output) {
		const first = device.configurations && device.configurations[0];
		if (!first) throw new Error(`The ${label} does not expose a printable configuration.`);
		await device.selectConfiguration(first.configurationValue);
		output = findUsbOutput(device);
	}
	if (!output) throw new Error(`No output endpoint was found on this ${label}.`);
	if (!device.configuration || device.configuration.configurationValue !== output.configurationValue)
		await device.selectConfiguration(output.configurationValue);
	await device.claimInterface(output.interfaceNumber);
	if (output.alternateSetting) await device.selectAlternateInterface(output.interfaceNumber, output.alternateSetting);
	return output;
}

export async function transferChunks(device, endpoint, bytes, chunk = 4096) {
	for (let offset = 0; offset < bytes.length; offset += chunk) {
		const part = bytes.slice(offset, Math.min(offset + chunk, bytes.length));
		const result = await device.transferOut(endpoint, part);
		// 4 KB chunks: larger bulk transfers are rejected by some cheap thermal printers.
		if (result.status !== "ok") throw new Error("The printer stopped accepting data.");
	}
}

/** Tiny event emitter for hardware status (no external dependency). */
export function createEmitter() {
	const listeners = new Set();
	return {
		emit: (value) => listeners.forEach((fn) => fn(value)),
		subscribe: (fn) => {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
	};
}
