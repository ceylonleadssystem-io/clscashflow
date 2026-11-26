/** The loading bar and success message of changes made through adminApi(). */
import { adminFeedback, useAdminFeedback } from "./adminFeedback";

export function AdminFeedbackBar() {
	const feedback = useAdminFeedback();
	return (
		<>
			{feedback.busy > 0 && <div className="admin-progress" role="progressbar" aria-label="Saving changes"><span /></div>}
			{feedback.message && (
				<div className="admin-success" role="status" key={feedback.message.id}>
					<span aria-hidden="true">✓</span> {feedback.message.text}
					<button type="button" aria-label="Dismiss message" onClick={adminFeedback.dismiss}>×</button>
				</div>
			)}
		</>
	);
}
