/**
 * Catalogue management page: a category manager (categories and subcategories) and the products and
 * services list or thumbnail grid, with import, barcode labels, edit and delete.
 */
import { useMemo, useState } from "react";
import { money } from "../domain/format";
import { productMargin, subcategoriesFor, categoryKey, visibleProductCategories } from "../domain/catalog";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { CatalogueImportModal } from "../modals/CatalogueImportModal";
import { useCheckout } from "../store/CheckoutProvider";

/** Catalogue management: categories, subcategories and products & services. */
export function Products() {
	const data = useData();
	const { svc } = usePos();
	const { openProduct, openBarcode } = useModals();
	const { removeProductFromCart } = useCheckout();
	const subcats = useFeature("catalogue.subcategories");
	const importFeature = useFeature("catalogue.import");
	const thumbs = useFeature("catalogue.thumbnailView");
	const barcodes = useFeature("catalogue.barcodeLabels");
	const [importOpen, setImportOpen] = useState(false);

	// category manager state
	const [catSearch, setCatSearch] = useState("");
	const [catFilter, setCatFilter] = useState("all");
	const [newCategory, setNewCategory] = useState("");
	// product list state
	const [q, setQ] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const mode = thumbs && data.settings.productManagementView === "grid" ? "grid" : "list";

	const visible = useMemo(() => visibleProductCategories(data.categories, data.products, data.subcategories), [data.categories, data.products, data.subcategories]);
	const categories = useMemo(
		() =>
			visible.filter((name) => {
				const key = categoryKey(name);
				const count = data.products.filter((p) => categoryKey(p.category) === key).length;
				const subs = subcategoriesFor(data.subcategories, name);
				const search = catSearch.trim().toLowerCase();
				return (
					(catFilter === "all" || (catFilter === "with-products" && count) || (catFilter === "empty" && !count)) &&
					(!search || name.toLowerCase().includes(search) || subs.some((s) => s.name.toLowerCase().includes(search)))
				);
			}),
		[visible, data.products, data.subcategories, catSearch, catFilter],
	);
	const filter = visible.includes(categoryFilter) ? categoryFilter : "all";
	const products = useMemo(
		() =>
			data.products.filter((p) => {
				const text = [p.name, p.code, p.category, p.subcategory, p.type].join(" ").toLowerCase();
				return (filter === "all" || p.category === filter) && (typeFilter === "all" || p.type === typeFilter) && (!q.trim() || text.includes(q.trim().toLowerCase()));
			}),
		[data.products, filter, typeFilter, q],
	);

	const del = async (id) => {
		const deleted = await svc.catalog.deleteProduct(id);
		if (deleted) removeProductFromCart(id);
	};
	const addCategory = async () => {
		if (await svc.catalog.addCategory(newCategory)) setNewCategory("");
	};
	const Actions = ({ p }) => (
		<div className="table-actions">
			{barcodes && (
				<button className="btn out barcode-action" data-product-barcode={p.id} onClick={() => openBarcode(p.id)}>
					Print Barcode
				</button>
			)}
			<button className="btn out" onClick={() => openProduct(p.id)}>
				Edit
			</button>
			<button className="btn danger" onClick={() => del(p.id)}>
				Delete
			</button>
		</div>
	);

	return (
		<section className="view active" id="view-products">
			<div style={{ display: "grid", gap: 16 }}>
				<Panel
					title="Categories"
					subtitle="Organise main categories and subcategories"
					actions={
						<button className="btn" type="button" onClick={addCategory}>
							+ Add Category
						</button>
					}
				>
					<div className="modal-body">
						<div className="catalog-toolbar">
							<input className="input" id="category-search" placeholder="Search categories or subcategories" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
							<select className="input" id="category-filter" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
								<option value="all">All categories</option>
								<option value="with-products">With products</option>
								<option value="empty">Empty categories</option>
							</select>
						</div>
						<div className="customer-lookup" style={{ marginTop: 12 }}>
							<input
								className="input"
								id="new-pos-category-products"
								placeholder="New main category name"
								value={newCategory}
								onChange={(e) => setNewCategory(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addCategory();
									}
								}}
							/>
							<button className="btn" type="button" onClick={addCategory}>
								Add Main Category
							</button>
						</div>
						<div id="pos-category-manager-products" className="category-manager">
							{categories.map((name) => {
								const count = data.products.filter((p) => categoryKey(p.category) === categoryKey(name)).length;
								const subs = subcategoriesFor(data.subcategories, name);
								return (
									<section className="category-card" key={name}>
										<div className="category-card-head">
											<div>
												<strong>{name}</strong>
												<small>
													{count} item(s){subcats ? ` · ${subs.length} subcategory(s)` : ""}
												</small>
											</div>
											<div className="table-actions">
												{subcats && (
													<button className="btn out" type="button" onClick={() => svc.catalog.addSubcategory(name)}>
														+ Subcategory
													</button>
												)}
												<button className="btn out" type="button" onClick={() => svc.catalog.renameCategory(name)}>
													Rename
												</button>
												<button className="btn danger" type="button" onClick={() => svc.catalog.deleteCategory(name)}>
													Delete
												</button>
											</div>
										</div>
										{subcats && (
											<div className="subcategory-list">
												{subs.map((s) => (
													<span className="subcategory-chip" key={s.id}>
														{s.name}
														<button title="Rename" onClick={() => svc.catalog.renameSubcategory(s.id)}>
															✎
														</button>
														<button title="Delete" onClick={() => svc.catalog.deleteSubcategory(s.id)}>
															×
														</button>
													</span>
												))}
												{!subs.length && <span className="muted">No subcategories yet</span>}
											</div>
										)}
									</section>
								);
							})}
							{!categories.length && <div className="empty">No categories match your search or filter.</div>}
						</div>
					</div>
				</Panel>
				<Panel
					title="Products & Services"
					subtitle="Manage cost, selling price and categories"
					actions={
						<div style={{ display: "flex", gap: 8 }}>
							{importFeature && (
								<button className="btn gold" type="button" onClick={() => setImportOpen(true)}>
									Import Items
								</button>
							)}
							<button className="btn" onClick={() => openProduct("")}>
								+ Add Item
							</button>
						</div>
					}
				>
					<div className="catalog-toolbar" style={{ padding: "14px 20px" }}>
						<input className="input" id="product-list-search" placeholder="Search name, code or category" value={q} onChange={(e) => setQ(e.target.value)} />
						<select className="input" id="product-list-category" value={filter} onChange={(e) => setCategoryFilter(e.target.value)}>
							<option value="all">All categories</option>
							{visible.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
						<select className="input" id="product-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
							<option value="all">Products & services</option>
							<option value="Product">Products only</option>
							<option value="Service">Services only</option>
						</select>
						{thumbs && (
							<div className="catalog-view-toggle">
								<button className={"btn out" + (mode === "list" ? " active" : "")} id="product-list-view" type="button" onClick={() => svc.settings.patchSettings({ productManagementView: "list" })}>
									☷ List
								</button>
								<button className={"btn out" + (mode === "grid" ? " active" : "")} id="product-grid-view" type="button" onClick={() => svc.settings.patchSettings({ productManagementView: "grid" })}>
									▦ Thumbnails
								</button>
							</div>
						)}
					</div>
					<div className="table-wrap" hidden={mode === "grid"}>
						<table>
							<thead>
								<tr>
									<th>Code</th>
									<th>Name</th>
									<th>Type</th>
									<th>Category</th>
									<th>Cost</th>
									<th>Selling</th>
									<th>Margin</th>
									<th></th>
								</tr>
							</thead>
							<tbody id="product-table">
								{products.map((p) => (
									<tr key={p.id}>
										<td>{p.code}</td>
										<td>
											<strong>{p.name}</strong>
											{p.image ? " · 📷" : ""}
										</td>
										<td>{p.type}</td>
										<td>
											<strong>{p.category}</strong>
											{p.subcategory && <small className="table-subcategory">{p.subcategory}</small>}
										</td>
										<td>{money(p.cost)}</td>
										<td>{money(p.price)}</td>
										<td>{productMargin(p)}%</td>
										<td>
											<Actions p={p} />
										</td>
									</tr>
								))}
								{!products.length && (
									<tr>
										<td colSpan="8">No products or services match your search.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					{mode === "grid" && (
						<div id="product-management-grid" className="product-management-grid">
							{products.map((p) => (
								<article className="catalog-product-card" key={p.id}>
									<div className="catalog-card-media">
										{p.image ? (
											<img src={p.image} alt="" style={{ objectFit: p.imageFit || "cover", objectPosition: `${p.imagePositionX ?? 50}% ${p.imagePositionY ?? 50}%` }} />
										) : (
											<div className="catalog-card-placeholder">{p.type === "Service" ? "Service" : "Product"}</div>
										)}
										<span className="catalog-type-badge">{p.type || "Product"}</span>
									</div>
									<div className="catalog-card-body">
										<small>{p.code || "No code"}</small>
										<h3>{p.name}</h3>
										<div className="muted">
											{p.category}
											{p.subcategory ? " · " + p.subcategory : ""}
										</div>
										<div className="catalog-card-prices">
											<span>Cost {money(p.cost)}</span>
											<strong>{money(p.price)}</strong>
										</div>
										<Actions p={p} />
									</div>
								</article>
							))}
							{!products.length && <div className="empty">No products or services match your search.</div>}
						</div>
					)}
				</Panel>
			</div>
			<CatalogueImportModal open={importOpen} onClose={() => setImportOpen(false)} />
		</section>
	);
}
