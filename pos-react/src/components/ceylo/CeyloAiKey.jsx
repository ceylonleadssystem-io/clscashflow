/**
 * Settings > Plan & Support > Ceylo AI key: the business can use its own AI account (Claude, ChatGPT or Gemini) for Ceylo's
 * answers. The key is sent once to the server, tested, stored encrypted and never shown again (only its last 4 characters).
 */
import { useEffect, useState } from "react";
import { aiKey } from "../../services/ceyloAi";
import { isAppwrite } from "../../config/env";
import { useUi } from "../../store/UiProvider";

const PROVIDERS = [
	{ id: "anthropic", label: "Claude (Anthropic)", model: "claude-opus-5-5", hint: "Optional. Leave empty for claude-opus-5-5.", keyHint: "Starts with sk-ant-. Create it at console.anthropic.com." },
	{ id: "openai", label: "ChatGPT (OpenAI)", model: "", hint: "Required. The model name from your OpenAI account.", keyHint: "Starts with sk-. Create it at platform.openai.com." },
	{ id: "gemini", label: "Gemini (Google)", model: "", hint: "Required. The model name from Google AI Studio.", keyHint: "Create it at aistudio.google.com." },
];

export function CeyloAiKeyPanel() {
	const ui = useUi();
	const cloud = isAppwrite();
	const [status, setStatus] = useState(null);
	const [provider, setProvider] = useState("anthropic");
	const [model, setModel] = useState("");
	const [key, setKey] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		if (cloud) aiKey("status").then((r) => setStatus(r.key), (e) => setError(e.message));
	}, [cloud]);
	const p = PROVIDERS.find((x) => x.id === provider);
	const save = async (e) => {
		e.preventDefault();
		setBusy(true);
		setError("");
		try {
			const r = await aiKey("save", { provider, key: key.trim(), model: model.trim() });
			setStatus(r.key);
			setKey("");
			ui.notice("AI key saved and tested. Ceylo now answers with " + r.key.providerLabel + ".");
		} catch (err) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};
	const remove = async () => {
		if (!(await ui.confirm("Remove your AI key? Ceylo will use Ceylonry's AI again (if your plan includes it)."))) return;
		setBusy(true);
		try {
			setStatus((await aiKey("remove")).key);
			ui.notice("AI key removed.");
		} catch (err) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="panel" id="ceylo-ai-key">
			<div className="panel-head">
				<div>
					<div className="panel-title">Ceylo AI key</div>
					<div className="muted">Use your own AI account for Ceylo's answers. Usage is billed by your AI provider.</div>
				</div>
			</div>
			<div className="modal-body" style={{ display: "grid", gap: 12 }}>
				{!cloud ? (
					<p className="muted">AI keys can be added in the cloud version of the POS.</p>
				) : (
					<>
						<p className="plan-settings-note" id="ceylo-ai-key-status" role="status">
							{status === null ? "Checking…" : status.saved ? `Using your ${status.providerLabel} key ending ••${status.last4} · model ${status.model} · saved ${new Date(status.savedAt).toLocaleDateString()}` : "No key saved. Ceylo uses Ceylonry's AI when your plan includes it."}
						</p>
						<form className="form-grid" onSubmit={save} autoComplete="off">
							<div className="field">
								<label htmlFor="ceylo-ai-provider">AI provider</label>
								<select className="input" id="ceylo-ai-provider" value={provider} onChange={(e) => (setProvider(e.target.value), setModel(""))}>
									{PROVIDERS.map((x) => (
										<option key={x.id} value={x.id}>
											{x.label}
										</option>
									))}
								</select>
							</div>
							<div className="field">
								<label htmlFor="ceylo-ai-model">Model</label>
								<input className="input" id="ceylo-ai-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={p.model || "Model name"} required={!p.model} maxLength={80} />
								<small className="muted">{p.hint}</small>
							</div>
							<div className="field" style={{ gridColumn: "1 / -1" }}>
								<label htmlFor="ceylo-ai-secret">API key</label>
								<input className="input" id="ceylo-ai-secret" type="password" autoComplete="new-password" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} placeholder={status?.saved ? "Paste a new key to replace the saved one" : "Paste your API key"} required maxLength={300} />
								<small className="muted">{p.keyHint} It is tested, stored encrypted and never shown again.</small>
							</div>
							{error && (
								<div role="alert" className="ceylo-error" style={{ gridColumn: "1 / -1" }}>
									{error}
								</div>
							)}
							<div style={{ display: "flex", gap: 8, flexWrap: "wrap", gridColumn: "1 / -1" }}>
								<button className="btn gold" type="submit" id="ceylo-ai-save" disabled={busy || !key.trim()}>
									{busy ? "Testing…" : "Save & test key"}
								</button>
								{status?.saved && (
									<button className="btn out" type="button" onClick={remove} disabled={busy}>
										Remove key
									</button>
								)}
							</div>
						</form>
					</>
				)}
			</div>
		</div>
	);
}
