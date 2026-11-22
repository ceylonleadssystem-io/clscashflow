/**
 * The bar across the top of the POS while a live support session is waiting, connecting or running: the client always sees that support is
 * connected and can end the session in one tap. It is not part of the live view sent to support.
 */
import { endSupport, useSupport } from "../../services/supportLive";

const spaced = (code) => String(code || "").replace(/^(\d{3})(\d{3})$/, "$1 $2");

export function SupportBanner() {
	const s = useSupport();
	if (!["waiting", "connecting", "live"].includes(s.status)) return null;
	return (
		<div className="support-banner support-block" data-support-block role="status" aria-live="polite" id="support-banner">
			<span className="support-banner-text">
				{s.status === "waiting" && (
					<>
						Support code <strong className="support-banner-code">{spaced(s.code)}</strong>: read it to Ceylonry Support. Waiting for them to join.
					</>
				)}
				{s.status === "connecting" && "Ceylonry Support is joining…"}
				{s.status === "live" && "Ceylonry Support can see this screen."}
			</span>
			<button type="button" className="btn out" id="support-end" onClick={endSupport}>
				{s.status === "waiting" ? "Cancel" : "End session"}
			</button>
		</div>
	);
}
