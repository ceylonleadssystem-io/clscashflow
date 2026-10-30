/**
 * Kitchen Display settings (pure), saved as settings.kdsSettings and sent to every paired screen when it connects (and when they are saved):
 * a ticket turns amber after `warnMinutes` and red after `lateMinutes`, `sound` is whether a new ticket beeps, `recallCount` is how many finished
 * tickets "Recall done" lists.
 */
export const KDS_DEFAULTS = { warnMinutes: 8, lateMinutes: 15, sound: true, recallCount: 10 };

const whole = (v, fallback) => (Number.isFinite(Math.floor(Number(v))) && v !== "" && v !== null && v !== undefined ? Math.floor(Number(v)) : fallback);

export function cleanKds(v = {}) {
	return {
		warnMinutes: whole(v.warnMinutes, KDS_DEFAULTS.warnMinutes),
		lateMinutes: whole(v.lateMinutes, KDS_DEFAULTS.lateMinutes),
		sound: v.sound === undefined ? KDS_DEFAULTS.sound : !!v.sound,
		recallCount: whole(v.recallCount, KDS_DEFAULTS.recallCount),
	};
}

/** Why these settings cannot be saved ("" when they can). */
export function kdsError(v) {
	if (!(v.warnMinutes >= 1 && v.warnMinutes <= 120)) return "Warn after must be 1 to 120 minutes.";
	if (!(v.lateMinutes > v.warnMinutes && v.lateMinutes <= 240)) return "Late after must be more than the warning time, and at most 240 minutes.";
	if (!(v.recallCount >= 1 && v.recallCount <= 50)) return "Recall list must show 1 to 50 tickets.";
	return "";
}

export const kdsSettingsOf = (settings = {}) => cleanKds(settings.kdsSettings);
