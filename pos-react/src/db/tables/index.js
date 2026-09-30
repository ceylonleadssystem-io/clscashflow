import * as catalog from "./catalog";
import * as customers from "./customers";
import * as sales from "./sales";
import * as staff from "./staff";
import * as inventory from "./inventory";
import * as business from "./business";
import * as industry from "./industry";

/** Every table spec, keyed by JS name. */
export const T = {
	...catalog,
	...customers,
	...sales,
	...staff,
	...inventory,
	...business,
	...industry,
};

export const TABLE_LIST = Object.values(T);
export const TABLE_BY_NAME = Object.fromEntries(TABLE_LIST.map((t) => [t.name, t]));
