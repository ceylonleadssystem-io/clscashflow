import { Component } from "react";

/** Last line of defence: a crash in one screen never leaves a blank page. */
export class ErrorBoundary extends Component {
	state = { error: null };
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, info) {
		console.error("POS screen crashed", error, info);
	}
	render() {
		if (!this.state.error) return this.props.children;
		return (
			<div className="app-loading" style={{ padding: 24, textAlign: "center" }}>
				<div>
					<h2>Something went wrong</h2>
					<p className="muted">Your data is safe on this device. Reload the POS to continue.</p>
					<pre style={{ maxWidth: 560, overflow: "auto", textAlign: "left", fontSize: 12 }}>{String(this.state.error?.message || this.state.error)}</pre>
					<button className="btn gold" onClick={() => window.location.reload()}>
						Reload POS
					</button>
				</div>
			</div>
		);
	}
}
