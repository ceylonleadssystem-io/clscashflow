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
const onWindows = () => typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent || "");

/**
 * The browser's own USB errors ("Access denied", "Unable to claim interface") say nothing a shop owner can act on. This turns them into what
 * to do about it. `error.usbKind` is "denied" or "busy" for those two; any other error is returned unchanged.
 */
export function explainUsbError(error, label = "USB device", windows = onWindows()) {
	const text = String((error && error.message) || error || "");
	const name = (error && error.name) || "";
	const denied = name === "SecurityError" || /access denied/i.test(text);
	const busy = !denied && (name === "NetworkError" || /unable to claim|already in use|in use by/i.test(text));
	if (!denied && !busy) return error;
	const message = busy
		? `Another program or browser tab is already using this ${label}. Close it (other POS tabs, label or printer software), unplug and replug the printer, and try again.`
		: windows
			? `Windows is already using this ${label} with its own printer driver, so the browser is not allowed to open it ("Access denied").\n\nWays to fix it:\n1. Print through the Windows driver: install the printer's Windows driver, then use the browser print option and choose the printer there.\n2. Let the POS talk to the printer directly: switch the printer's driver to WinUSB with the free tool Zadig (Options > List All Devices > select the printer > WinUSB > Replace Driver), then unplug and replug the printer.\n3. Use the print helper: install the free QZ Tray app (qz.io/download) and choose Connect via Print Helper in Settings > Device Manager > Printers. Nothing about the driver changes.\n\nAlso close other tabs or programs that use the printer.`
			: `The system or another program is already using this ${label}, so the browser is not allowed to open it ("Access denied"). Close other tabs or programs that use it, unplug and replug the printer, and try again. You can also print through the browser print option.`;
	return Object.assign(new Error(message), { usbKind: busy ? "busy" : "denied", cause: error });
}

export async function claimUsbOutput(device, label = "USB device") {
	try {
		return await claimOutput(device, label);
	} catch (error) {
		throw explainUsbError(error, label);
	}
}

async function claimOutput(device, label) {
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
