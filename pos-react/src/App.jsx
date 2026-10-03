/**
 * Root of the POS app: builds the provider tree (UI, session, data, features, modals, POS, checkout) and
 * chooses what to show - loading bar, business sign-in, staff PIN gate, stock-count page or the main Shell.
 */
import { useEffect, useState } from "react";
import { UiProvider, useUi } from "./store/UiProvider";
import { SessionProvider, useSession } from "./store/SessionProvider";
import { DataProvider, useData } from "./store/DataProvider";
import { FeatureProvider } from "./store/FeatureProvider";
import { ModalsProvider } from "./store/ModalsProvider";
import { PosProvider, usePos } from "./store/PosProvider";
import { CheckoutProvider } from "./store/CheckoutProvider";
import { BusinessGate } from "./gates/BusinessGate";
import { StaffGate } from "./gates/StaffGate";
import { CheckoutModeGate } from "./gates/CheckoutModeGate";
import { StockCount } from "./views/StockCount";
import { Shell } from "./components/layout/Shell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GearLoader } from "./components/ui/GearLoader";

/**
 * Provider tree:
 *   Ui -> Session (auth, workspace DB, cloud sync)
 *      -> Data (live WatermelonDB snapshot) -> Features (admin switches)
 *      -> Modals -> Pos (staff session, services) -> Checkout (current order)
 */
export default function App() {
	return (
		<ErrorBoundary>
			<UiProvider>
				<SessionProvider>
					<Root />
				</SessionProvider>
			</UiProvider>
		</ErrorBoundary>
	);
}

// `progress` is accepted for call-site compatibility; the gear spinner needs no percentage.
const Loading = ({ children = "Loading…" }) => (
	<div className="app-loading">
		<GearLoader label={children} />
	</div>
);

// DataProvider is keyed by dbName so switching business accounts remounts every provider below it
// instead of leaking the previous workspace's snapshot, staff session and cart.
function Root() {
	const { phase, workspace } = useSession();
	if (phase === "booting") return <Loading progress={12}>Starting up…</Loading>;
	if (phase === "signed-out") return <BusinessGate />;
	if (phase === "activating" || !workspace) return <Loading progress={40}>Loading your POS…</Loading>;
	return (
		<DataProvider key={workspace.dbName} store={workspace.store}>
			<Ready />
		</DataProvider>
	);
}

function Ready() {
	const data = useData();
	// platform.js (payment screens) prices the POS plan from this; the server re-derives the amount itself.
	const tier = data.settings?.plan?.tier;
	useEffect(() => {
		window._posPlanTier = tier || "starter";
	}, [tier]);
	if (!data.ready) return <Loading progress={72}>Opening local database…</Loading>;
	return (
		<FeatureProvider>
			<ModalsProvider>
				<PosProvider>
					<CheckoutProvider>
						<Gate />
					</CheckoutProvider>
				</PosProvider>
			</ModalsProvider>
		</FeatureProvider>
	);
}

function Gate() {
	const { currentUser, support, chooserOpen } = usePos();
	const { billing, restoredNotice } = useSession();
	const ui = useUi();
	const [hash, setHash] = useState(window.location.hash);
	useEffect(() => {
		const on = () => setHash(window.location.hash);
		window.addEventListener("hashchange", on);
		return () => window.removeEventListener("hashchange", on);
	}, []);
	useEffect(() => {
		if (restoredNotice) ui.notice("Your saved POS items were restored and synced.");
	}, [restoredNotice, ui]);
	if (!billing.allowed) return <Loading>Subscription payment required. Complete the payment dialog to continue.</Loading>;
	if (!currentUser && !support)
		return (
			<>
				<StaffGate />
				{chooserOpen && <CheckoutModeGate />}
			</>
		);
	if (hash === "#/count" && !support) return <StockCount />;
	return <Shell />;
}
