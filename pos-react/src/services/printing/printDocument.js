/** Browser printing helpers (hidden iframe, pop-up window). */

export function printHtmlInFrame(html, title = "Print job") {
	document.querySelectorAll(".pos-print-frame").forEach((f) => f.remove());
	const frame = document.createElement("iframe");
	frame.className = "pos-print-frame";
	frame.title = title;
	frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
	frame.srcdoc = html.replace("onload=()=>print()", "");
	frame.addEventListener(
		"load",
		() => {
			setTimeout(() => {
				try {
					frame.contentWindow.focus();
					frame.contentWindow.print();
				} catch {
					alert("The system print service could not open. Check the printer connection and try again.");
				}
			}, 80);
		},
		{ once: true },
	);
	document.body.append(frame);
	setTimeout(() => frame.isConnected && frame.remove(), 120000);
}

/** Opens a pop-up with the document (legacy behaviour). Returns false when blocked. */
export function printHtmlInWindow(html) {
	const w = window.open("", "_blank", "width=420,height=700");
	if (!w) return false;
	w.document.open();
	w.document.write(html);
	w.document.close();
	return true;
}
