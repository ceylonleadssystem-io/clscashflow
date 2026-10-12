// The CashFlow app pages live in /cashflow/; tests keep naming them by file name ('solo.html') and resolve the real path here.
const MOVED = new Set(['solo', 'starter', 'starter_3', 'growth', 'premium', 'team', 'accept-invite', 'signin', 'onboarding', 'upgrade', 'success', 'payable-return', 'reset-password', 'invoice-public', 'ceylonry-admin'].map((n) => n + '.html'));
exports.pagePath = (file) => (MOVED.has(file) ? 'cashflow/' + file : file);
