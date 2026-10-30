/**
 * The business type is chosen once, when the business is set up. After that only the Ceylonry administration team can change it (admin portal,
 * "Business type"), because it decides which features and pages the business gets. `businessTypeLocked` is stored when the type is chosen.
 * Businesses that finished setup before this rule existed (onboardingComplete) count as locked.
 */
export const businessTypeLocked = (settings = {}) => settings.businessTypeLocked === true || settings.onboardingComplete === true;
