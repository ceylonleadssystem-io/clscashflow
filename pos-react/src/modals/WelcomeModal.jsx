/**
 * First-login welcome message (shown again when an admin bumps its version) and the "View plans" pricing
 * dialog opened from Settings.
 */
import { Modal, ModalBody } from "../components/ui";
import { PlansGrid } from "../components/PlansGrid";
import { resolveWelcome } from "../config/welcome";
import { env } from "../config/env";
import { planForSettings } from "../config/plans";
import { T } from "../db/tables";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

/**
 * Special message shown to each POS user the first time they sign in (and again
 * whenever the administrator bumps the message version). Also opened on demand
 * from Settings → Plan & Support ("View plans").
 */
export function WelcomeModal() {
	const { welcomeUser, setWelcomeUser, ctx } = usePos();
	const data = useData();
	const welcome = resolveWelcome(data.settings);
	if (!welcomeUser) return null;
	const close = async () => {
		const user = data.users.find((u) => u.id === welcomeUser.id);
		if (user && welcomeUser.firstTime) await ctx.store.write((tx) => tx.put(T.users, { ...user, welcomeSeenVersion: welcome.version }));
		setWelcomeUser(null);
	};
	// "View plans & pricing" (Settings > Plan & Support) shows the pricing sheet, not the welcome message.
	if (welcomeUser.plansOnly)
		return (
			<Modal
				id="plans-modal"
				open
				title="Choose the right plan for your business"
				subtitle="Simple & transparent pricing. Powerful POS features to help you sell, manage and grow, at a price that fits your needs."
				onClose={close}
				boxClassName="plans-modal"
				footer={
					<button className="btn gold" onClick={close}>
						Close
					</button>
				}
			>
				<ModalBody>
					<PlansGrid currentPlan={planForSettings(data.settings).id} onSelect={() => window.open(env.onboardingUrl, "_blank", "noopener")} />
				</ModalBody>
			</Modal>
		);
	return (
		<Modal
			id="welcome-modal"
			open
			title={welcome.title}
			subtitle={welcomeUser.firstTime ? "Hello " + welcomeUser.name + "!" : undefined}
			onClose={close}
			boxClassName="welcome-box"
			footer={
				<button className="btn gold" onClick={close}>
					{welcomeUser.firstTime ? "Get started" : "Close"}
				</button>
			}
		>
			<ModalBody>
				{welcome.message && <p className="welcome-message">{welcome.message}</p>}
				{welcome.showPlans && (
					<PlansGrid currentPlan={data.settings.plan?.tier} onSelect={() => window.open(env.onboardingUrl, "_blank", "noopener")} />
				)}
			</ModalBody>
		</Modal>
	);
}
