#!/usr/bin/env python3
"""Builds the Postman collection for OGF's POS-02 UAT test (docs/ogf-postman/ogf-pos02-uat.postman_collection.json).
Run: python3 docs/ogf-postman/build.py   The bodies are the records the POS sends (netlify/lib/ogf-sales.js), with the dates, batch codes and receipt
numbers filled in by the pre-request script so every run is a fresh, valid submission."""
import json, os

HELP = r"""
// Mall time is Sri Lanka (UTC+5:30, no daylight saving). Everything here is generated fresh for each request.
const mall = new Date(Date.now() + 5.5 * 3600 * 1000);
const two = (n) => String(n).padStart(2, '0');
const stamp = mall.getUTCFullYear() + two(mall.getUTCMonth() + 1) + two(mall.getUTCDate()) + two(mall.getUTCHours()) + two(mall.getUTCMinutes()) + two(mall.getUTCSeconds());
const set = (k, v) => pm.collectionVariables.set(k, v);
set('receiptDate', two(mall.getUTCDate()) + '/' + two(mall.getUTCMonth() + 1) + '/' + mall.getUTCFullYear());
set('receiptTime', two(mall.getUTCHours()) + ':' + two(mall.getUTCMinutes()) + ':' + two(mall.getUTCSeconds()));
// one batch number, one submission: ddmmyyyyhhmmss, and never the same twice in a row
let batch = two(mall.getUTCDate()) + two(mall.getUTCMonth() + 1) + mall.getUTCFullYear() + two(mall.getUTCHours()) + two(mall.getUTCMinutes()) + two(mall.getUTCSeconds());
if (batch === pm.collectionVariables.get('lastBatch')) { const d = new Date(mall.getTime() + 1000); batch = two(d.getUTCDate()) + two(d.getUTCMonth() + 1) + d.getUTCFullYear() + two(d.getUTCHours()) + two(d.getUTCMinutes()) + two(d.getUTCSeconds()); }
set('batchCode', batch); set('lastBatch', batch);
const tomorrow = new Date(mall.getTime() + 86400000);
set('futureDate', two(tomorrow.getUTCDate()) + '/' + two(tomorrow.getUTCMonth() + 1) + '/' + tomorrow.getUTCFullYear());
"""

def receipts(*names):
    return "\n".join("pm.collectionVariables.set('%s', 'TEST-%s-%s' + '-' + (pm.collectionVariables.get('runNo') || '1'));" % (n, n.upper(), "' + stamp + '") for n in names)

def test_ok(expect_records, extra=""):
    return f"""
pm.test('HTTP 200', () => pm.response.to.have.status(200));
const j = pm.response.json();
pm.test('ReturnStatus is Success', () => pm.expect(j.ReturnStatus).to.eql('Success'));
pm.test('every record was imported ({expect_records})', () => {{ pm.expect(j.RecordsReceived).to.eql({expect_records}); pm.expect(j.RecordsImported).to.eql({expect_records}); }});
pm.test('the batch code is echoed back', () => pm.expect(j.BatchCode).to.eql(pm.collectionVariables.get('batchCode')));
pm.test('no error details', () => pm.expect(j.ErrorDetails || '').to.eql(''));
{extra}"""

TEST_REJECTED = """
pm.test('HTTP 200 (the mall answers, with the failure in the body)', () => pm.response.to.have.status(200));
const j = pm.response.json();
pm.test('the mall did NOT import everything (expected for this negative test)', () => pm.expect(j.RecordsImported).to.be.below(j.RecordsReceived));
pm.test('the mall says which rows failed or why', () => pm.expect((j.DefectiveRowNos || '') + (j.ErrorDetails || '')).to.not.eql(''));
console.log('Answer: ' + JSON.stringify(j));
"""

def rec(receipt_var, kind, amounts, items, method="Cash", date="{{receiptDate}}", time="{{receiptTime}}", n_items=None, prop="{{propertyCode}}", tax_rate=0, svc=0):
    b4, after = amounts
    return {
        "PropertyCode": prop, "POSInterfaceCode": "{{posInterfaceCode}}", "ReceiptDate": date, "ReceiptTime": time, "ReceiptNo": "{{%s}}" % receipt_var,
        "NoOfItems": n_items if n_items is not None else sum(i[3] for i in items), "SalesCurrency": "LKR",
        "TotalSalesAmtB4Tax": b4, "TotalSalesAmtAfterTax": after, "SalesTaxRate": tax_rate, "ServiceChargeAmt": svc,
        "PaymentAmt": after, "PaymentCurrency": "LKR", "PaymentMethod": method, "SalesType": kind,
        "Items": [{"ItemDesc": d, "ItemAmt": a, "ItemDiscountAmt": disc, "ItemDiscoumtAmt": disc} for (d, a, disc, q) in items],
    }

def body(records, **over):
    h = {"AppCode": "POS-02", "PropertyCode": "{{propertyCode}}", "ClientID": "{{clientId}}", "ClientSecret": "{{clientSecret}}", "POSInterfaceCode": "{{posInterfaceCode}}", "BatchCode": "{{batchCode}}", "PosSales": records}
    h.update(over)
    return json.dumps(h, indent=2)

def request(name, description, records, tests, pre="", header_over=None):
    return {
        "name": name,
        "event": [
            {"listen": "prerequest", "script": {"type": "text/javascript", "exec": (HELP + pre).split("\n")}},
            {"listen": "test", "script": {"type": "text/javascript", "exec": tests.strip().split("\n")}},
        ],
        "request": {
            "auth": {"type": "bearer", "bearer": [{"key": "token", "value": "{{accessToken}}", "type": "string"}]},
            "method": "POST", "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": body(records, **(header_over or {})), "options": {"raw": {"language": "json"}}},
            "url": {"raw": "{{baseUrl}}/api/possale/importpossaleswithitems", "host": ["{{baseUrl}}"], "path": ["api", "possale", "importpossaleswithitems"]},
            "description": description,
        },
    }

# --- the receipts of the examples (the same numbers as the unit tests of the mapper) ---------------------------------------------------------------
# a restaurant bill: 2 Latte (500 each) + 1 Cake (750); 10% discount 175; 10% service charge 157.50; 18% tax on the items 283.50; total 2016.00
BILL = lambda var, kind="Sales", method="Credit Card": rec(var, kind, (1732.5, 2016.0), [("2 x Latte (Oat)", 1000.0, 100.0, 2), ("Cake", 750.0, 75.0, 1)], method=method, tax_rate=16.36, svc=157.5)
CASH = lambda var, kind="Sales": rec(var, kind, (500.0, 525.0), [("Apple", 300.0, 0.0, 1), ("Orange", 200.0, 0.0, 1)], tax_rate=5.0)

items = []
items.append({
    "name": "1. Get access token",
    "event": [{"listen": "test", "script": {"type": "text/javascript", "exec": """
pm.test('HTTP 200', () => pm.response.to.have.status(200));
const j = pm.response.json();
pm.test('a Bearer token came back', () => { pm.expect(j.access_token).to.be.a('string').and.not.empty; pm.expect(String(j.token_type).toLowerCase()).to.eql('bearer'); });
pm.collectionVariables.set('accessToken', j.access_token);
console.log('Token expires in ' + j.expires_in + ' seconds');
""".strip().split("\n")}}],
    "request": {"method": "POST", "header": [{"key": "Content-Type", "value": "application/x-www-form-urlencoded"}],
        "body": {"mode": "urlencoded", "urlencoded": [{"key": "grant_type", "value": "client_credentials", "type": "text"}, {"key": "client_id", "value": "{{clientId}}", "type": "text"}, {"key": "client_secret", "value": "{{clientSecret}}", "type": "text"}]},
        "url": {"raw": "{{baseUrl}}/connect/token", "host": ["{{baseUrl}}"], "path": ["connect", "token"]},
        "description": "OAuth 2.0 client credentials with the client credentials sent in the body, as in OGF's Postman guide. The token is kept for the other requests."},
})
items.append(request("2. Sales - cash, 2 items, 5% tax", "The sample of the spec: Apple 300 + Orange 200, tax 5%, cash.", [CASH("r1")], test_ok(1), pre=receipts("r1")))
items.append(request("3. Sales - restaurant bill with discount, service charge and tax (card)", "What the POS sends for a restaurant bill: items 1750, discount 175, service charge 157.50, tax 283.50, total 2016.00 (tax rate sent is the effective 16.36%).", [BILL("r2")], test_ok(1), pre=receipts("r2")))
items.append(request("4. Sales - split payment (cash + credit card), two receipts in one batch", "Two different receipts in one batch; the payment methods comma separated.", [BILL("r3a", method="Cash, Credit Card"), CASH("r3b")], test_ok(2), pre=receipts("r3a", "r3b")))
items.append(request("5a. Sales - receipt that is voided next", "The receipt the next request voids.", [BILL("rv")], test_ok(1), pre=receipts("rv")))
items.append(request("5b. Void - same receipt number, later batch", "A void is its own record with the same receipt number and positive amounts, sent in a later batch than the sale.", [BILL("rv", kind="Void")], test_ok(1), pre=""))
items.append(request("6a. Sales - receipt that is partly refunded next", "", [BILL("rf")], test_ok(1), pre=receipts("rf")))
items.append(request("6b. Refund - one Latte back (576.00)", "A refund of part of a sale: only the refunded items, the money returned as the amount.", [rec("rf", "Refund", (495.0, 576.0), [("Latte (Oat)", 500.0, 50.0, 1)], method="Credit Card", tax_rate=16.36, svc=45.0)], test_ok(1), pre=""))
items.append(request("7. Return (goods come back)", "Same as a refund but the goods are collected back. The POS sends partial refunds as Refund or Return (a setting).", [CASH("rr", kind="Return")], test_ok(1), pre=receipts("rr")))
items.append(request("8. Exchange", "In the spec's list of sales types. The POS does not create Exchange records yet: this is here to ask OGF how they expect one.", [CASH("rx", kind="Exchange")], test_ok(1), pre=receipts("rx")))
neg = []
neg.append(request("N1. Duplicate receipt in one batch (should be refused)", "OGF checks: no duplicate receipt in a batch.", [CASH("n1"), CASH("n1")], TEST_REJECTED, pre=receipts("n1")))
neg.append(request("N2. Receipt dated tomorrow (should be refused)", "OGF checks: transaction date not after the submission date.", [rec("n2", "Sales", (500.0, 525.0), [("Apple", 500.0, 0.0, 1)], date="{{futureDate}}", tax_rate=5.0)], TEST_REJECTED, pre=receipts("n2")))
neg.append(request("N3. Wrong property code inside the record (should be refused)", "A record whose PropertyCode differs from the header is rejected.", [rec("n3", "Sales", (500.0, 525.0), [("Apple", 500.0, 0.0, 1)], prop="XXXX", tax_rate=5.0)], TEST_REJECTED, pre=receipts("n3")))
neg.append(request("N4. Negative amount (should be refused)", "OGF checks: all amounts positive, even for voids and refunds.", [rec("n4", "Sales", (-500.0, -525.0), [("Apple", 500.0, 0.0, 1)], tax_rate=5.0)], TEST_REJECTED, pre=receipts("n4")))
items.append({"name": "Negative tests (each should be refused by the mall)", "item": neg})

collection = {
    "info": {"name": "OGF POS-02 UAT (Transaction With Item)", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
             "description": "Tests of OGF's POS REST API as in their 'RestFul API Testing with Postman' guide and spec v2.4/2.5. Run the requests in order (or with the Runner). Import the environment too and fill in clientId, clientSecret, propertyCode and posInterfaceCode (given by OGF). The secret is never saved in this file."},
    "item": items,
    "variable": [{"key": "accessToken", "value": ""}, {"key": "lastBatch", "value": ""}],
}
environment = {
    "id": "ogf-uat", "name": "OGF UAT", "_postman_variable_scope": "environment",
    "values": [
        {"key": "baseUrl", "value": "https://uat2-pos.imonitor.center", "type": "default", "enabled": True},
        {"key": "propertyCode", "value": "", "type": "default", "enabled": True},
        {"key": "posInterfaceCode", "value": "", "type": "default", "enabled": True},
        {"key": "clientId", "value": "", "type": "default", "enabled": True},
        {"key": "clientSecret", "value": "", "type": "secret", "enabled": True},
    ],
}
here = os.path.dirname(os.path.abspath(__file__))
json.dump(collection, open(os.path.join(here, "ogf-pos02-uat.postman_collection.json"), "w"), indent=2, ensure_ascii=False)
json.dump(environment, open(os.path.join(here, "ogf-uat.postman_environment.json"), "w"), indent=2)
print("written:", len(items), "top-level items,", len(neg), "negative tests")
