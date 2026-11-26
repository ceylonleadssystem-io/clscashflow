/**
 * End of Day page (left navigation, under Reports): the End of Day report for one day. What it shows is set in System Options > EOD Reports.
 */
import { EodPanel } from "./reports/EodPanel";

export function EndOfDayPage() {
	return (
		<section className="view active" id="view-eod">
			<EodPanel preview />
		</section>
	);
}
