/**
 * Settings > System Options > Sales push (OGF only). A Restaurant (OGF) business sends every completed sale, with its items, to the mall's POS
 * interface about once an hour. This page holds what that needs: the server addresses and property code, one login per register, what is sent
 * and how, a test of the login, a preview of the exact records, Send now, and the log of what the mall answered. The client secret is typed here
 * but kept only on the server: it is never shown again.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasCapability } from "../../config/capabilities";
import { DetailDrawer, EmptyState } from "../../components/settings/kit/entities";
import { PageHeader, SectionCard, SelectRow, SettingRow, TextRow, ToggleRow } from "../../components/settings/kit/rows";
import { INTERVALS, PAYMENT_ROWS, formFrom, formProblems, newRegister, registerProblem } from "../../domain/ogfPush";
import { ogfCall } from "../../services/ogfPush";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { useUi } from "../../store/UiProvider";

const when = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "never");

export function SalesPushPage() {
	const { settings, locations } = useData();
	const { svc } = usePos();
	const { auth, authKind, syncNow } = useSession();
	const ui = useUi();
	const cloud = authKind === "appwrite";
	const saved = useMemo(() => formFrom(settings.ogfPush), [settings.ogfPush]);
	const [form, setForm] = useState(saved);
	const [status, setStatus] = useState(null);
	const [busy, setBusy] = useState("");
	const [preview, setPreview] = useState(null);
	const [edit, setEdit] = useState(null); // { reg, secret, error }
	useEffect(() => setForm(saved), [saved]);
	const dirty = JSON.stringify(form) !== JSON.stringify(saved);
	const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
	const problems = formProblems(form);
	const devices = (Array.isArray(settings.posDevices) ? settings.posDevices : []).filter((d) => d && d.id && d.name);

	const refresh = useCallback(async () => {
		if (!cloud) return;
		const r = await ogfCall(auth, { action: "status" });
		setStatus(r.ok ? r : { error: r.message });
	}, [auth, cloud]);
	useEffect(() => {
		refresh();
	}, [refresh]);

	const saveForm = async (next = form) => {
		await svc.settings.patchSettings({ ogfPush: next });
		ui.notice("Sales push settings saved.");
		await syncNow?.(); // the push reads the settings and the sales from the cloud copy
	};
	// every action below reads the saved settings and the synced sales on the server
	const act = async (name, body, done) => {
		if (dirty) return void (await ui.alert("Save the settings first: the push uses the saved ones."));
		setBusy(name);
		try {
			await syncNow?.();
			const r = await ogfCall(auth, body);
			await done(r);
			await refresh();
		} finally {
			setBusy("");
		}
	};
	const test = () =>
		act("test", { action: "test", registerId: form.registers[0]?.id }, (r) => ui.alert(r.message || (r.ok ? "Connected." : "The test failed.")));
	const showPreview = () => act("preview", { action: "preview", count: 3 }, (r) => (r.ok ? setPreview(r) : ui.alert(r.message || "No preview.")));
	const sendNow = () =>
		act("send", { action: "sendNow" }, (r) => ui.alert(r.ok ? (r.sent ? r.sent + " record(s) sent. " : "") + (r.message || "") : r.message || "Nothing was sent."));
	const retry = async () => {
		const r = await ogfCall(auth, { action: "retryHeld" });
		ui.notice(r.ok ? r.released + " held receipt(s) will be sent again." : r.message);
		refresh();
	};

	const openRegister = (reg) => setEdit({ reg: { ...reg }, secret: "", error: "" });
	const saveRegister = async () => {
		const hasSecret = !!status?.secrets?.[edit.reg.id];
		const error = registerProblem(edit.reg, hasSecret, edit.secret);
		if (error) return setEdit((x) => ({ ...x, error }));
		if (edit.secret.trim()) {
			const r = await ogfCall(auth, { action: "saveSecret", registerId: edit.reg.id, secret: edit.secret });
			if (!r.ok) return setEdit((x) => ({ ...x, error: r.message || "The secret was not saved." }));
		}
		const exists = form.registers.some((x) => x.id === edit.reg.id);
		const next = { ...form, registers: exists ? form.registers.map((x) => (x.id === edit.reg.id ? edit.reg : x)) : [...form.registers, edit.reg] };
		setEdit(null);
		await saveForm(next);
		refresh();
	};
	const removeRegister = async (reg) => {
		if (!(await ui.confirm("Remove " + (reg.name || reg.posInterfaceCode || "this register") + " and its saved login?"))) return;
		await ogfCall(auth, { action: "deleteSecret", registerId: reg.id });
		await saveForm({ ...form, registers: form.registers.filter((x) => x.id !== reg.id) });
		refresh();
	};
	const where = (r) => (r.deviceId ? "Device: " + (devices.find((d) => d.id === r.deviceId)?.name || r.deviceId) : r.locationId ? "Location: " + (locations.find((l) => l.id === r.locationId)?.name || r.locationId) : "Every location");

	if (!hasCapability(settings.businessType, "salesPush"))
		return (
			<>
				<PageHeader title="Sales push (OGF only)" />
				<SectionCard>
					<EmptyState title="Only for Restaurant (OGF)">The sales push is for businesses in One Galle Face. Its business type is set by Ceylonry.</EmptyState>
				</SectionCard>
			</>
		);

	return (
		<>
			<PageHeader
				title="Sales push (OGF only)"
				description="Sends every completed sale, with its items, to One Galle Face's POS interface about once an hour. Voids and refunds are sent as their own records."
				actions={
					<button type="button" className="btn gold" id="save-sales-push" disabled={!dirty} onClick={() => saveForm()}>
						{dirty ? "Save settings" : "Saved"}
					</button>
				}
			/>
			{!cloud && (
				<SectionCard>
					<EmptyState title="Needs the cloud account">The push runs on the server from the synced sales, so it needs the business to be signed in with its cloud account.</EmptyState>
				</SectionCard>
			)}
			<SectionCard title="Sending" description="Test first, then switch to Live when OGF has approved the test.">
				<ToggleRow id="op-enabled" label="Send sales to One Galle Face" help="Off: nothing is sent." value={form.enabled} onChange={(v) => (v && problems.length ? ui.alert("Not ready yet:\n" + problems.join("\n")) : set("enabled")(v))} />
				<SelectRow id="op-env" label="Server" help="Test is OGF's test server. Switch to Live only after the go-live test." value={form.environment} options={[{ value: "test", label: "Test" }, { value: "live", label: "Live" }]} onChange={set("environment")} />
				<SelectRow id="op-interval" label="Send every" help="OGF asks for about once an hour." value={String(form.intervalMinutes)} options={INTERVALS.map((m) => ({ value: String(m), label: m < 60 ? m + " minutes" : m / 60 + (m === 60 ? " hour" : " hours") }))} onChange={(v) => set("intervalMinutes")(Number(v))} />
				<SettingRow label="First day to send" help="Sales before this date are never sent. Set it to the opening date. Leave blank to send everything." htmlFor="op-from">
					<input id="op-from" className="input" type="date" value={form.sendFrom} onChange={(e) => set("sendFrom")(e.target.value)} />
				</SettingRow>
			</SectionCard>
			<SectionCard title="Connection" description="Given to you by OGF's technical team.">
				<TextRow id="op-prop" label="Property code" help="For example OGF1." value={form.propertyCode} max={8} onChange={set("propertyCode")} />
				<TextRow id="op-test" label="Test server address" help="Starts with https://" placeholder="https://" value={form.testBaseUrl} max={300} onChange={set("testBaseUrl")} />
				<TextRow id="op-live" label="Live server address" help="Starts with https://" placeholder="https://" value={form.liveBaseUrl} max={300} onChange={set("liveBaseUrl")} />
				<details className="sk-advanced">
					<summary>Paths (only if OGF gives different ones)</summary>
					<TextRow id="op-token" label="Login path" value={form.tokenPath} max={120} onChange={set("tokenPath")} />
					<TextRow id="op-import" label="Import path" value={form.importPath} max={160} onChange={set("importPath")} />
				</details>
			</SectionCard>
			<SectionCard title="Registers" description="OGF gives each register its own POS interface code and login. Sales go with the register of their device, else of their location.">
				{!form.registers.length && <EmptyState title="No registers yet">Add the register OGF set up for this shop.</EmptyState>}
				{form.registers.length > 0 && (
					<ul className="sk-list">
						{form.registers.map((r) => (
							<li key={r.id} className="sk-list-row" data-register={r.id}>
								<span>
									<strong>{r.name || r.posInterfaceCode}</strong>
									<span className="muted"> · {r.posInterfaceCode} · {where(r)}</span>
								</span>
								<span className={"sk-badge"}>{status?.secrets?.[r.id] ? "Login saved" : "No secret yet"}</span>
								<span className="sk-list-actions">
									<button type="button" className="btn out" onClick={() => openRegister(r)}>
										Edit
									</button>
									<button type="button" className="btn danger" onClick={() => removeRegister(r)}>
										Remove
									</button>
								</span>
							</li>
						))}
					</ul>
				)}
				<button type="button" className="btn gold" id="add-register" onClick={() => openRegister(newRegister(form.registers.length + 1))} style={{ marginTop: 10 }}>
					Add register
				</button>
			</SectionCard>
			<SectionCard title="What is sent" description="OGF's documents leave some of these open. The defaults follow the written spec; change them if OGF says otherwise.">
				<SelectRow id="op-basis" label="Item amounts" help="Each item's amount before tax (the spec's example) or after tax (the sample file)." value={form.itemAmountBasis} options={[{ value: "before-tax", label: "Before tax" }, { value: "after-tax", label: "After tax" }]} onChange={set("itemAmountBasis")} />
				<ToggleRow id="op-afterdisc" label="Take the discount off the item amounts" help="Off: the amount is the item's price and the discount is shown separately." value={form.itemAmountsAfterDiscount} onChange={set("itemAmountsAfterDiscount")} />
				<SelectRow id="op-count" label="Number of items" help="Total quantity (2 coffees = 2) or the number of lines on the receipt." value={form.noOfItems} options={[{ value: "quantity", label: "Total quantity" }, { value: "lines", label: "Number of lines" }]} onChange={set("noOfItems")} />
				<SelectRow id="op-discfield" label="Discount field name" help="The spec and its sample file spell it differently; both is safest until OGF confirms." value={form.discountField} options={[{ value: "both", label: "Send both spellings" }, { value: "ItemDiscountAmt", label: "ItemDiscountAmt" }, { value: "ItemDiscoumtAmt", label: "ItemDiscoumtAmt (spec spelling)" }]} onChange={set("discountField")} />
				<SelectRow id="op-refund" label="Refund of part of a sale is sent as" help="Return = the goods come back. Exchange is not supported." value={form.refundType} options={[{ value: "Refund", label: "Refund" }, { value: "Return", label: "Return" }]} onChange={set("refundType")} />
				<TextRow id="op-cur" label="Sales currency" help="OGF's base currency code." value={form.salesCurrency} max={8} onChange={(v) => set("salesCurrency")(v.toUpperCase())} />
				<SettingRow label="Payment names" help="The name OGF should see for each way of paying. Others are sent as they are." wide>
					<div className="sk-paymap">
						{PAYMENT_ROWS.map(([ours, theirs]) => (
							<label key={ours}>
								<span>{ours}</span>
								<input className="input" value={form.paymentMap[ours] ?? theirs} maxLength={32} aria-label={"OGF name for " + ours} onChange={(e) => set("paymentMap")({ ...form.paymentMap, [ours]: e.target.value })} />
							</label>
						))}
					</div>
				</SettingRow>
			</SectionCard>
			<SectionCard title="Check and send">
				{problems.length > 0 && (
					<ul className="sk-problems" id="sales-push-problems">
						{problems.map((p) => (
							<li key={p}>{p}</li>
						))}
					</ul>
				)}
				<div className="sk-list-line" style={{ gap: 8, flexWrap: "wrap" }}>
					<button type="button" className="btn out" id="op-test-btn" disabled={!cloud || !!busy || !form.registers.length} onClick={test}>
						{busy === "test" ? "Testing…" : "Test connection"}
					</button>
					<button type="button" className="btn out" id="op-preview" disabled={!cloud || !!busy} onClick={showPreview}>
						{busy === "preview" ? "Preparing…" : "Preview what is sent"}
					</button>
					<button type="button" className="btn gold" id="op-send" disabled={!cloud || !!busy || !form.enabled} title={form.enabled ? "" : "Switch the push on first"} onClick={sendNow}>
						{busy === "send" ? "Sending…" : "Send now"}
					</button>
				</div>
				<p className="muted">Test and preview use the saved settings and the sales that have synced to the cloud. Make a test sale and wait a moment for it to sync.</p>
			</SectionCard>
			<SectionCard title="Status" description="What was sent and what the mall answered.">
				{!status && cloud && <p className="muted">Loading…</p>}
				{status?.error && <p role="alert">{status.error}</p>}
				{status && !status.error && (
					<>
						<dl className="admin-dl" id="sales-push-status">
							<dt>Last run</dt>
							<dd>{when(status.lastRunAt)} · {status.lastStatus || "—"}{status.lastMessage ? " · " + status.lastMessage : ""}</dd>
							<dt>Waiting to send</dt>
							<dd>{status.waiting.sales} receipt(s), {status.waiting.reversals} void/refund record(s)</dd>
							<dt>Sent so far</dt>
							<dd>{status.sentCount} receipt(s)</dd>
						</dl>
						{status.issues?.length > 0 && (
							<ul className="sk-problems">
								{status.issues.map((i) => (
									<li key={i.key}>{i.key.split("|").slice(1).join("|")}: {i.message}</li>
								))}
							</ul>
						)}
						{status.held?.length > 0 && (
							<div className="print-note" id="sales-push-held">
								{status.held.length} receipt(s) are held after the mall refused them: {status.held.map((h) => h.receipt).join(", ")}. {status.held[0].message}
								<div>
									<button type="button" className="btn out" onClick={retry} style={{ marginTop: 8 }}>
										Send them again
									</button>
								</div>
							</div>
						)}
						{status.batches?.length > 0 && (
							<div className="table-wrap">
								<table id="sales-push-log">
									<thead>
										<tr>
											<th>Batch</th>
											<th>Time</th>
											<th>Register</th>
											<th>Records</th>
											<th>Imported</th>
											<th>Result</th>
										</tr>
									</thead>
									<tbody>
										{status.batches.map((b) => (
											<tr key={b.batchCode + b.at}>
												<td>{b.batchCode}</td>
												<td>{when(b.at)}</td>
												<td>{b.register}{b.phase === "reversal" ? " (voids / refunds)" : ""}</td>
												<td>{b.records}</td>
												<td>{b.imported}</td>
												<td>{b.status}{b.message && b.status !== "Success" ? ": " + b.message : ""}{b.defectiveRows ? " (rows " + b.defectiveRows + ")" : ""}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit && form.registers.some((x) => x.id === edit.reg.id) ? "Edit register" : "Add register"}
				subtitle="The details OGF gave this register."
				onClose={() => setEdit(null)}
				footer={
					<>
						<button type="button" className="btn out" onClick={() => setEdit(null)}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-register" onClick={saveRegister}>
							Save register
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="rg-name" label="Name" help="For you, for example Main till." value={edit.reg.name} max={60} autoFocus onChange={(v) => setEdit((x) => ({ ...x, reg: { ...x.reg, name: v } }))} />
						<SelectRow id="rg-loc" label="Location" help="Sales made at this location go with this register." value={edit.reg.locationId} options={[{ value: "", label: "Every location" }, ...locations.filter((l) => l.active !== false).map((l) => ({ value: l.id, label: l.name }))]} onChange={(v) => setEdit((x) => ({ ...x, reg: { ...x.reg, locationId: v } }))} />
						<SelectRow id="rg-dev" label="Device" help="Only if this register is one device of the location." value={edit.reg.deviceId} options={[{ value: "", label: "Any device" }, ...devices.map((d) => ({ value: d.id, label: d.name }))]} onChange={(v) => setEdit((x) => ({ ...x, reg: { ...x.reg, deviceId: v } }))} />
						<TextRow id="rg-code" label="POS interface code" help="For example CCB1-PS-23-00000039." value={edit.reg.posInterfaceCode} max={40} onChange={(v) => setEdit((x) => ({ ...x, reg: { ...x.reg, posInterfaceCode: v } }))} />
						<TextRow id="rg-client" label="Client ID" value={edit.reg.clientId} max={200} onChange={(v) => setEdit((x) => ({ ...x, reg: { ...x.reg, clientId: v } }))} />
						<SettingRow label="Client secret" help={status?.secrets?.[edit.reg.id] ? "A secret is saved. Leave blank to keep it, or type a new one to replace it. It is never shown again." : "Kept on the server only, never shown again."} htmlFor="rg-secret" error={edit.error}>
							<input id="rg-secret" className="input" type="password" autoComplete="new-password" value={edit.secret} maxLength={200} onChange={(e) => setEdit((x) => ({ ...x, secret: e.target.value }))} />
						</SettingRow>
					</>
				)}
			</DetailDrawer>
			<DetailDrawer open={!!preview} wide title="What would be sent" subtitle="The latest sales as OGF receives them (the login is not shown). Nothing has been sent." onClose={() => setPreview(null)} footer={<button type="button" className="btn gold" onClick={() => setPreview(null)}>Close</button>}>
				{preview && (
					<>
						{preview.issues?.map((i) => (
							<p key={i.key} role="alert">{i.key}: {i.message}</p>
						))}
						{!preview.PosSales?.length ? <p className="muted">There are no sales to show yet.</p> : <pre className="sk-json" id="sales-push-preview">{JSON.stringify({ ...preview.header, PosSales: preview.PosSales }, null, 2)}</pre>}
					</>
				)}
			</DetailDrawer>
		</>
	);
}
