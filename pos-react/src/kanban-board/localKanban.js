/** The feature board in local development: kept in localStorage; "import" adds sample cards instead of reading GitHub. */
const BOARD = "ceylonry-dev-kanban";
export function localKanban(body, author) {
	const board = JSON.parse(localStorage.getItem(BOARD) || '{"cards":[],"updates":[]}');
	const save = () => localStorage.setItem(BOARD, JSON.stringify(board));
	const card = board.cards.find((c) => c.id === body.cardId);
	if (body.action === "kanbanImport") {
		const samples = [["Sample feature: date filter on reports", "todo"], ["Sample feature: quick staff switching", "progress"], ["Sample feature: end of day report", "built"]];
		const missing = samples.map(([title, status], i) => ({ id: "sample_" + i, issue: 0, title, status, lastUpdateAt: "" })).filter((s) => !board.cards.some((c) => c.id === s.id));
		board.cards.push(...missing);
		save();
		return { ok: true, added: missing.length, cards: board.cards };
	}
	if (body.action === "kanbanList") return { ok: true, cards: board.cards };
	if (!card) throw new Error("This card no longer exists.");
	if (body.action === "kanbanUpdates") return { ok: true, updates: board.updates.filter((u) => u.cardId === card.id) };
	if (body.action === "kanbanMove") {
		card.status = body.status;
		save();
		return { ok: true, card };
	}
	const update = { id: "u" + Date.now(), cardId: card.id, message: String(body.message).trim(), author, at: new Date().toISOString() };
	board.updates.push(update);
	card.lastUpdateAt = update.at;
	save();
	return { ok: true, update };
}
