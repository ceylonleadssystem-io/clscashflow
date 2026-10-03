/**
 * UI services for business logic: transient notices and promise-based alert, confirm and prompt dialogs
 * (replacing window.alert/confirm/prompt).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * UI services used by business logic: transient notices and promise based
 * alert / confirm / prompt dialogs (replacing window.alert/confirm/prompt while
 * keeping the same call shape: `await ui.confirm("Delete?")`).
 */
const UiContext = createContext(null);
const NoticeContext = createContext({ text: "", show: false });

export function UiProvider({ children }) {
	const [notice, setNotice] = useState({ text: "", show: false });
	const timer = useRef(0);
	const [dialog, setDialog] = useState(null);

	const showNotice = useCallback((text) => {
		clearTimeout(timer.current);
		setNotice({ text, show: true });
		timer.current = setTimeout(() => setNotice((n) => ({ ...n, show: false })), 6000);
	}, []);

	const ask = useCallback(
		(type, message, defaultValue = "") =>
			new Promise((resolve) => setDialog({ type, message, defaultValue, resolve })),
		[],
	);

	const ui = useMemo(
		() => ({
			notice: showNotice,
			alert: (message) => ask("alert", message),
			confirm: (message) => ask("confirm", message),
			prompt: (message, defaultValue) => ask("prompt", message, defaultValue),
		}),
		[ask, showNotice],
	);

	const close = (value) => {
		dialog?.resolve(value);
		setDialog(null);
	};

	return (
		<UiContext.Provider value={ui}>
			<NoticeContext.Provider value={notice}>
				{children}
				{dialog && <DialogModal dialog={dialog} onClose={close} />}
			</NoticeContext.Provider>
		</UiContext.Provider>
	);
}

function DialogModal({ dialog, onClose }) {
	const [value, setValue] = useState(dialog.defaultValue || "");
	const confirmRef = useRef(null);
	useEffect(() => {
		confirmRef.current?.focus();
	}, []);
	const cancelValue = dialog.type === "prompt" ? null : false;
	const okValue = dialog.type === "prompt" ? value : dialog.type === "alert" ? undefined : true;
	return (
		<div
			className="modal open ui-dialog"
			style={{ zIndex: 100000 }}
			role="dialog"
			aria-modal="true"
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose(dialog.type === "alert" ? undefined : cancelValue);
			}}
		>
			<div className="modal-box" style={{ width: "min(460px,100%)" }}>
				<div className="modal-body" style={{ paddingBottom: 6 }}>
					<p style={{ margin: 0, lineHeight: 1.5, whiteSpace: "pre-line", fontWeight: 600 }}>{dialog.message}</p>
					{dialog.type === "prompt" && (
						<input
							className="input"
							style={{ marginTop: 12 }}
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && onClose(value)}
							autoFocus
						/>
					)}
				</div>
				<div className="modal-foot">
					{dialog.type !== "alert" && (
						<button className="btn out" type="button" onClick={() => onClose(cancelValue)}>
							Cancel
						</button>
					)}
					<button ref={confirmRef} className="btn gold" type="button" onClick={() => onClose(okValue)}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export const useUi = () => useContext(UiContext);
export const useNotice = () => useContext(NoticeContext);
