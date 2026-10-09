/**
 * Add to Home Screen steps for iPhone / iPad (Safari has no install prompt). Opened from the header's Install App button.
 */
import { useEffect } from "react";

export function IosInstallGuide({ open, onClose }) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	if (!open) return null;
	return (
		<div className="ios-fullscreen-guide" id="ios-install-guide" role="dialog" aria-modal="true" aria-labelledby="ios-install-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div className="ios-fullscreen-card">
				<h2 id="ios-install-title">Install Ceylonry POS</h2>
				<p>Add the register to your home screen to open it like an app, full screen and working offline.</p>
				<ol className="ios-fullscreen-steps">
					<li>
						<span>
							Open this page in <strong>Safari</strong>, then tap the <strong>Share</strong> button (the square with an arrow pointing up) in the toolbar.
						</span>
					</li>
					<li>
						<span>
							Scroll down and choose <strong>Add to Home Screen</strong>.
						</span>
					</li>
					<li>
						<span>
							Tap <strong>Add</strong>. Open Ceylonry POS from the new home screen icon.
						</span>
					</li>
				</ol>
				<button type="button" className="btn gold" style={{ width: "100%" }} onClick={onClose} autoFocus>
					Got it
				</button>
			</div>
		</div>
	);
}
