# Restaurant (OGF) and the OGF sales push

A business of type **Restaurant (OGF)** is a restaurant (tables, kitchen tickets, modifiers, split bills, service charge, reports) that also sends its sales to
One Galle Face's POS interface (POS-02, "Transaction With Item", spec v2.4 / v2.5 and the New OGF Tenant Briefing v1.8).

## Where it lives
- **Address:** `ogf.ceylonrylabs.io` (the same POS app and business login). Signing in on any other address moves an OGF business here, and an OGF business is
  moved off any other address, without a second sign-in (`pos-react/src/domain/posRoute.js`).
- **Business type:** set in the admin portal (Account management > account > Business type, or when creating an account). Businesses cannot choose it.
- **Settings page:** Settings > System Options > **Sales push (OGF only)**. Only an OGF business sees it.
- **Code:** `netlify/lib/ogf-sales.js` (sale to receipt record), `netlify/lib/ogf-push.js` (sending, state, rejections), `netlify/functions/ogf-push.js` (what the
  settings page calls), `netlify/functions/ogf-push-scheduled.js` (every 15 minutes; a business is sent when its interval, default 60 minutes, is due).

## Setting a business up
1. Admin portal: create the account (or change an existing account) with the type **Restaurant (OGF)**.
2. The business signs in at `https://ogf.ceylonrylabs.io`.
3. Settings > System Options > Sales push: property code, test server address, then **Add register** for each register OGF set up (POS interface code, client ID,
   client secret, and the location or device it belongs to). The secret is stored on the server only and is never shown again.
4. **Test connection**, then make a test sale, wait for it to sync, and **Preview what is sent** to check the record, then **Send now**.
5. Switch **Send sales to One Galle Face** on. Set **First day to send** to the opening date.
6. After OGF's UAT, switch the server to **Live**. At go-live OGF runs one full test on the live system; every test transaction must then be **voided** in the POS,
   and the push sends the matching Void records.

## What is sent
One record per completed sale, with its items. Our prices are before tax, so: **TotalSalesAmtB4Tax** = items - discount + service charge, **TotalSalesAmtAfterTax**
= the total paid, **SalesTaxRate** = the effective rate (tax / amount before tax), **ServiceChargeAmt**, **PaymentAmt** = the total, **PaymentMethod** (split payments
comma separated, in OGF's names), dates and times in Sri Lanka time. A **void** and each **refund** is its own record with the same receipt number, positive
amounts, and is sent in a later batch than the receipt. Held orders, cancelled orders and anything dated in the future are not sent. Each batch has its own
batch number; failed rows are retried, rows the mall keeps refusing are held for a person (Status > Send them again), and an outage never counts against a receipt.

## Things the documents leave open (to confirm with OGF)
The page offers a setting for each, with the default that follows the written spec.
1. **ItemAmt:** the spec's example adds up to the amount *before* tax; the sample file's items add up to the amount *after* tax. (Item amounts: before / after tax.)
2. **Discount field name:** the spec says `ItemDiscoumtAmt`, the sample file `ItemDiscountAmt`. By default both are sent.
3. **NoOfItems:** total quantity or number of lines (the sample file shows 4 with 2 item rows).
4. **SalesTaxRate:** one rate per receipt; several taxes, or tax not charged on the service charge, give an effective rate that is not a round number.
5. **Return and Exchange:** a partial refund is sent as Refund (or Return). Exchange is not supported.
6. **Field lengths:** PaymentMethod (16) and POSInterfaceCode (16) are shorter than OGF's own examples ("CASH, CREDIT CARD", "CCB1-PS-23-00000039"); nothing is cut.
7. **Void record:** sent with the same receipt number as the sale, as in the briefing's sample data.
8. **Rejected rows:** `DefectiveRowNos` is read as 1-based row numbers. If a partial answer does not say which rows failed, the batch is held rather than risk a receipt counted twice.
9. **Server addresses, property code, logins, a test server, lease dates, fixed IP address needed?** None of these are in the documents.
10. **Reward app:** not built; the Reward API specification has not been received.

## Limits
- The push runs on Netlify from the synced cloud copy, so a sale is sent after it has synced (a few seconds online, later after an offline period).
- It only calls public `https` server names, never an address on a private network.
- Not yet tried against OGF's real test server.
