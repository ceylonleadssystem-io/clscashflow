# Ceylonry POS: New Feature Roll-out Notes

Short guide to the features and fixes released recently: what each does, how it works, and the steps to use it.

---

## 1. Item stock counts and ingredients

**What it does.** Every sellable item can have its own stock count and its own ingredient list. When the item is sold, both go down: the item's stock by the quantity sold, and each ingredient by its per-unit amount. It works like the package supplies in Automobile Detailing.

**How it works.**
- An item's stock count lives in Inventory (the item's own stock row).
- Its ingredients are a recipe: a list of stock items and the quantity used per one unit sold.
- At checkout, the sale deducts the recipe ingredients and the item's own stock.

**Steps: set item stock counts in bulk**
1. Open **Inventory**.
2. Click **Set product stock**.
3. Enter the quantity for each product already in the system and save.

**Steps: add ingredients to an item**
1. Open **Inventory** and find the item row, then click **Ingredients**. Alternatively, open **Menu Admin > Items**, open the item and use its **Ingredients** option.
2. Pick each ingredient from your stock items and enter the quantity used per one unit sold. Use the × to remove a row.
3. Save.
4. To add stock ingredients to many items at once, use **Add ingredients** in Inventory.

**Check it worked.** Sell one unit of the item. Its stock count and each ingredient should drop by the amounts you set.

---

## 2. Branch-specific menus

**What it does.** Each item and each category can be limited to certain locations. Branches only see and sell what is meant for them.

**How it works.**
- An empty location list means "all locations".
- An item shows at a branch only when both the item and its category allow that branch.
- Choosing "All locations" in the admin shows everything.

**Steps**
1. Open **Menu Admin > Categories**, open a category and set **Shown at** to the branches that should list it.
2. Open **Menu Admin > Items**, open an item and set **Sold at** for that item only.
3. Use the location filter and the badges on the Items and Categories lists to see what is limited where.
4. Publish the menu changes.

---

## 3. Demo and Test accounts no longer ask for payment

**What it does.** Test accounts skip the "Payment required" screen after the free trial ends. They are blocked only if the account is paused.

**Steps.** None for users. Mark an account as a Test account in the admin as before.

---

## 4. Trial length and plan prices are consistent

- The POS free trial is **7 days** everywhere.
- CashFlow prices match the server values: **5500 / 7500 / 15500**.
- Duplicate Netlify function copies were removed so only one version runs.

---

## 5. Modifier groups: assign to items by tree

**What it does.** The "Assign modifier group to items" window now shows **Category > Subcategory > Items** as a tree with checkboxes.

**Steps**
1. Open the modifier group.
2. Tick a category to select everything under it, or open it and tick individual items.
3. Save.

---

## 6. Fixes

| Fix | Result |
| --- | --- |
| Clock In button alignment (#132) | Button now lines up correctly |
| Products and Services navigation button (#113) | Button opens the right page. The same issue on the Modifiers link was also fixed |
| Route ordered items to separate preparation stations (#110) | Re-checked and confirmed working; issue closed |

---

## Notes
- Items with no ingredients and no stock row behave as before.
- Existing data is not changed by any of these releases.
- Steps use the current screen labels; if a label differs on your build, tell the dev team.
