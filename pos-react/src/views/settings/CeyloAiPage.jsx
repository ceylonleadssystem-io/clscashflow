/**
 * Settings > System Options > Ceylo AI: choose the AI service Ceylo answers with (Claude, ChatGPT or Gemini) and add its API key
 * for each location. The key itself is handled by CeyloAiKeyPanel (tested, stored encrypted, never shown again).
 */
import { PageHeader } from "../../components/settings/kit/rows";
import { CeyloAiKeyPanel } from "../../components/ceylo/CeyloAiKey";

export function CeyloAiPage() {
	return (
		<>
			<PageHeader title="Ceylo AI" description="The AI that answers Ceylo's questions. Add the API key of the AI service you want to use." note="Usage is billed by that AI provider. Without a key, Ceylo uses Ceylonry's AI when your plan includes it." />
			<CeyloAiKeyPanel />
		</>
	);
}
