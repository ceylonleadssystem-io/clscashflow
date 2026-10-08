# EmailJS order e-mail template

The POS e-mails the customer their order through EmailJS. The layout lives in
[`public/email-templates/pos-order-email.html`](../public/email-templates/pos-order-email.html).

## Set it up

1. EmailJS > Email Templates > Create New Template > **Code editor** (HTML).
2. Copy the **whole** file `pos-order-email.html` and paste it into the editor. The file contains only the template
   body (no comments), so copy it exactly; do not retype, trim or "tidy" it. Every `{{#x}}` must have its `{{/x}}`.
3. Settings of the template: Subject `{{subject}}`, To Email `{{to_email}}`, From Name `{{from_name}}`, Reply To `{{reply_to}}`.
4. Put the template id in `VITE_EJS_ORDER_TEMPLATE` (or the business setting `ejsOrderTemplate`) and redeploy.

## Variables the POS sends (all ready-to-show text, money already formatted)

| Variable | Meaning |
|---|---|
| `order_number`, `receipt_number`, `order_date`, `order_reference`, `order_channel` | the order |
| `customer_name`, `business_name`, `business_address`, `business_email`, `business_logo` | people (logo only if it is an https link) |
| `orders` | list, one entry per line: `name`, `description`, `modifiers`, `quantity`, `unit_price`, `line_total`, `has_description`, `has_modifiers` |
| `items_count`, `subtotal`, `discount`, `service_charge`, `total`, `payment_method`, `footer_message`, `year` | totals and text |
| `has_discount`, `has_service_charge`, `has_reference`, `has_address`, `has_email`, `has_logo` | `"yes"` or empty: wrap optional blocks in `{{#has_x}} ... {{/has_x}}` |

Rules that keep the template valid in EmailJS:

- Loops and optional blocks use `{{#name}} ... {{/name}}`; each opening tag needs its closing tag, in order.
- A section is switched by a `has_*` flag, never by the value it wraps (`{{#has_email}}{{business_email}}{{/has_email}}`).
- Plain `{{x}}` is HTML-escaped by EmailJS.

## Error: "Template: One or more dynamic variables are corrupted"

EmailJS prints this in the e-mail body when the template has a malformed tag, almost always a `{{#x}}` without its
`{{/x}}` (or a `{{x}}` cut in half) after the template was copied or edited in the EmailJS editor. Paste the file again
as described above. The POS test (`catalog.test.js`, "EmailJS order template") checks that every section in the repo
file is closed and properly nested.
