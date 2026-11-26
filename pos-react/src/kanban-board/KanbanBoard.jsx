/**
 * Feature board (kanban.ceylonrylabs.io and the admin portal): every feature as a card in a column, with messages and updates under each card.
 * Cards move by dragging, or with the column list on the card (touch screens and keyboard).
 */
import { useCallback, useEffect, useState } from "react";
import { env } from "../config/env";
import { adminApi } from "../admin-app/adminApi";
import { createLogger } from "../utils/logger";
import "./kanban.css";

const log = createLogger("admin");
const COLUMNS = [["todo", "To do"], ["progress", "In progress"], ["built", "Built"], ["done", "Done"]];
const ISSUE_URL = "https://github.com/ceylonleadssystem-io/clscashflow/issues/";
const board = (body) => adminApi(body, env.kanbanUrl);
const when = (iso) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function KanbanBoard({ onExpired }) {
	const [cards, setCards] = useState(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	const run = useCallback(async (body) => {
		setError("");
		try {
			return await board(body);
		} catch (e) {
			log.warn("feature board request failed", e);
			setError(e.message);
			if (e.status === 401) onExpired?.(e.message);
			return null;
		}
	}, [onExpired]);

	const load = useCallback(async () => {
		const res = await run({ action: "kanbanList" });
		if (res) setCards(res.cards || []);
	}, [run]);
	useEffect(() => {
		load();
	}, [load]);

	const importFeatures = async () => {
		setBusy(true);
		const res = await run({ action: "kanbanImport" });
		if (res) setCards(res.cards || []);
		setBusy(false);
	};

	const patch = (id, change) => setCards((all) => all.map((c) => (c.id === id ? { ...c, ...change } : c)));
	const move = async (id, status) => {
		const from = cards.find((c) => c.id === id)?.status;
		if (!from || from === status) return;
		patch(id, { status });
		if (!(await run({ action: "kanbanMove", cardId: id, status }))) patch(id, { status: from });
	};

	return (
		<section aria-label="Feature board">
			<div className="tools" style={{ marginBottom: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
				<h2 style={{ margin: 0 }}>Feature board</h2>
				<button type="button" className="btn gold" id="kanban-import" onClick={importFeatures} disabled={busy}>
					{busy ? "Importing…" : "Import new features"}
				</button>
			</div>
			{error && <div className="print-note" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
			{!cards ? (
				!error && <p className="muted">Loading the board…</p>
			) : !cards.length ? (
				<p className="muted">The board is empty. Use "Import new features" to add a card for every feature.</p>
			) : (
				<div className="kanban">
					{COLUMNS.map(([key, label]) => {
						const list = cards.filter((c) => c.status === key).sort((a, b) => b.issue - a.issue);
						return (
							<div
								className="kanban-col"
								key={key}
								data-column={key}
								onDragOver={(e) => e.preventDefault()}
								onDrop={(e) => {
									e.preventDefault();
									move(e.dataTransfer.getData("text/plain"), key);
								}}
							>
								<h3>
									{label} <span className="muted">{list.length}</span>
								</h3>
								{list.map((c) => (
									<Card key={c.id} card={c} run={run} onMove={move} onPosted={(at) => patch(c.id, { lastUpdateAt: at })} />
								))}
								{!list.length && <p className="muted">No features here.</p>}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}

function Card({ card, run, onMove, onPosted }) {
	const [open, setOpen] = useState(false);
	const [updates, setUpdates] = useState(null);
	const [text, setText] = useState("");
	const [posting, setPosting] = useState(false);

	// loaded each time the card is opened, so messages from other administrators show up
	useEffect(() => {
		if (!open) return;
		let live = true;
		run({ action: "kanbanUpdates", cardId: card.id }).then((res) => live && res && setUpdates(res.updates || []));
		return () => {
			live = false;
		};
	}, [open, card.id, run]);

	const post = async (e) => {
		e.preventDefault();
		if (!text.trim() || posting) return;
		setPosting(true);
		const res = await run({ action: "kanbanAddUpdate", cardId: card.id, message: text.trim() });
		if (res) {
			setUpdates((all) => [...(all || []), res.update]);
			setText("");
			onPosted(res.update.at);
		}
		setPosting(false);
	};

	return (
		<article
			className="kanban-card"
			draggable={!open} // an open card has a text box: dragging would get in the way of selecting text
			onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
		>
			<strong>{card.title}</strong>
			<small className="muted">
				{card.issue > 0 && (
					<a href={ISSUE_URL + card.issue} target="_blank" rel="noreferrer">
						Issue {card.issue}
					</a>
				)}
				{card.lastUpdateAt && (card.issue > 0 ? " · " : "") + "Updated " + when(card.lastUpdateAt)}
			</small>
			<select className="input" aria-label={"Column for " + card.title} value={card.status} onChange={(e) => onMove(card.id, e.target.value)}>
				{COLUMNS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
			</select>
			<details onToggle={(e) => setOpen(e.currentTarget.open)}>
				<summary>Messages and updates</summary>
				{!updates ? (
					<p className="muted">Loading…</p>
				) : (
					<ul className="kanban-updates">
						{updates.map((u) => (
							<li key={u.id}>
								<small className="muted">{u.author} · {when(u.at)}</small>
								<p>{u.message}</p>
							</li>
						))}
						{!updates.length && <li className="muted">No messages yet.</li>}
					</ul>
				)}
				<form onSubmit={post}>
					<textarea className="input" aria-label={"New message or update for " + card.title} placeholder="Write a message or update…" maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} />
					<button type="submit" className="btn gold" disabled={posting || !text.trim()}>
						{posting ? "Posting…" : "Post update"}
					</button>
				</form>
			</details>
		</article>
	);
}
