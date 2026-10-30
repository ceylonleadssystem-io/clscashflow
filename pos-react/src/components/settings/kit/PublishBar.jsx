/**
 * Bottom bar of the Menu Admin pages: "N unpublished changes · Review · Publish". Review lists every draft change (what, and before to after).
 * Nothing changes on the POS until Publish.
 */
import { useState } from "react";
import { PAGES, draftChanges } from "../../../domain/menuAdmin";
import { useData } from "../../../store/DataProvider";
import { usePos } from "../../../store/PosProvider";
import { DetailDrawer } from "./entities";

export function PublishBar() {
	const { settings } = useData();
	const { svc } = usePos();
	const [review, setReview] = useState(false);
	const [busy, setBusy] = useState(false);
	const changes = draftChanges(settings);
	const publish = async () => {
		setBusy(true);
		try {
			if (await svc.settings.publishMenu()) setReview(false);
		} finally {
			setBusy(false);
		}
	};
	return (
		<>
			<div className={"sk-savebar sk-publishbar" + (changes.length ? " dirty" : "")} role="region" aria-label="Publish menu">
				<span aria-live="polite">{changes.length ? `${changes.length} unpublished change${changes.length === 1 ? "" : "s"}` : "Menu is up to date"}</span>
				<span className="sk-list-actions">
					<button type="button" className="btn out" disabled={!changes.length} onClick={() => setReview(true)}>
						Review
					</button>
					<button type="button" className="btn gold" id="publish-menu" disabled={!changes.length || busy} onClick={publish}>
						Publish
					</button>
				</span>
			</div>
			<DetailDrawer
				open={review}
				wide
				title="Review changes"
				subtitle="These are saved as drafts. Publishing puts them on every register."
				onClose={() => setReview(false)}
				footer={
					<>
						<button type="button" className="btn danger" style={{ marginRight: "auto" }} onClick={async () => (await svc.settings.discardMenuDraft()) && setReview(false)}>
							Discard all
						</button>
						<button type="button" className="btn out" onClick={() => setReview(false)}>
							Close
						</button>
						<button type="button" className="btn gold" disabled={!changes.length || busy} onClick={publish}>
							Publish
						</button>
					</>
				}
			>
				{changes.map((c) => (
					<div key={c.page + c.id + c.kind} className="sk-change">
						<strong>
							{PAGES[c.page].label}: {c.name}
						</strong>{" "}
						<span className="sk-badge">{c.kind === "added" ? "New" : c.kind === "removed" ? "Removed" : "Changed"}</span>
						{c.fields.map((f) => (
							<p key={f.field} className="muted">
								{f.field}: {f.before || "none"} → {f.after || "none"}
							</p>
						))}
					</div>
				))}
				{!changes.length && <p className="muted">No unpublished changes.</p>}
			</DetailDrawer>
		</>
	);
}
