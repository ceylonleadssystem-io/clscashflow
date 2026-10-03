/**
 * Add or edit a product or service: name, type, code, category/subcategory, prices, image upload with
 * drag/arrow positioning, modifier assignment and recipe (stock usage). Mounted globally via ProductModalHost.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { productCategories, subcategoriesFor } from "../domain/catalog";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { compressProductImage } from "../services/printing/imageTools";

const blank = () => ({
	id: "",
	name: "",
	type: "Product",
	code: "",
	category: "",
	newCategory: "",
	subcategory: "",
	cost: "",
	price: "",
	image: "",
	imageFit: "cover",
	imagePositionX: 50,
	imagePositionY: 50,
	modifierIds: [],
	modifierRules: {},
	recipe: [],
});

/** Add / edit a product or service (global host, opened from several screens). */
export function ProductModalHost() {
	const { product, closeProduct } = useModals();
	const open = product !== null;
	return <ProductModal id={product} open={open} onClose={closeProduct} />;
}

function ProductModal({ id, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const { openBarcode } = useModals();
	const subcats = useFeature("catalogue.subcategories");
	const positioning = useFeature("catalogue.imagePositioning");
	const recipes = useFeature("inventory.recipes");
	const barcodes = useFeature("catalogue.barcodeLabels");
	const [f, setF] = useState(blank);
	const dragging = useRef(null);
	const previewRef = useRef(null);

	useEffect(() => {
		if (!open) return;
		const p = data.products.find((x) => x.id === id);
		if (!p) return setF(blank());
		setF({
			...blank(),
			...p,
			category: p.category || "",
			cost: p.cost ?? "",
			price: p.price ?? "",
			subcategory: p.subcategory || "",
			imageFit: p.imageFit || "cover",
			imagePositionX: p.imagePositionX ?? 50,
			imagePositionY: p.imagePositionY ?? 50,
			modifierIds: p.modifierIds || [],
			modifierRules: p.modifierRules || {},
			recipe: p.recipe || [],
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);

	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
	const categories = useMemo(() => productCategories(data.categories, data.products), [data.categories, data.products]);
	const subs = useMemo(() => subcategoriesFor(data.subcategories, f.category), [data.subcategories, f.category]);
	useEffect(() => {
		if (f.subcategory && !subs.some((s) => s.name === f.subcategory)) setF((v) => ({ ...v, subcategory: "" }));
	}, [subs, f.subcategory]);

	const toggleModifier = (m, on) =>
		setF((v) => ({
			...v,
			modifierIds: on ? [...v.modifierIds, m.id] : v.modifierIds.filter((x) => x !== m.id),
			modifierRules: on ? { ...v.modifierRules, [m.id]: v.modifierRules[m.id] ?? m.required !== false } : Object.fromEntries(Object.entries(v.modifierRules).filter(([k]) => k !== m.id)),
		}));
	const toggleRecipe = (item, on) =>
		setF((v) => ({ ...v, recipe: on ? [...v.recipe, { itemId: item.id, qty: 1 }] : v.recipe.filter((r) => r.itemId !== item.id) }));
	const setRecipeQty = (itemId, qty) => setF((v) => ({ ...v, recipe: v.recipe.map((r) => (r.itemId === itemId ? { ...r, qty: Number(qty) || 0 } : r)) }));

	const onFile = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		const image = await compressProductImage(file);
		setF((v) => ({ ...v, image }));
	};
	const nudge = (dx, dy) => setF((v) => ({ ...v, imagePositionX: clamp(v.imagePositionX + dx), imagePositionY: clamp(v.imagePositionY + dy) }));
	const clamp = (n) => Math.max(0, Math.min(100, n));

	const onPointerDown = (e) => {
		if (!f.image || !positioning) return;
		dragging.current = { x: e.clientX, y: e.clientY, startX: +f.imagePositionX || 50, startY: +f.imagePositionY || 50 };
		e.currentTarget.setPointerCapture(e.pointerId);
		e.preventDefault();
	};
	const onPointerMove = (e) => {
		const d = dragging.current;
		if (!d) return;
		const rect = previewRef.current.getBoundingClientRect();
		setF((v) => ({
			...v,
			imagePositionX: +clamp(d.startX - ((e.clientX - d.x) / rect.width) * 100).toFixed(1),
			imagePositionY: +clamp(d.startY - ((e.clientY - d.y) / rect.height) * 100).toFixed(1),
		}));
	};
	const endDrag = () => (dragging.current = null);

	const save = async () => {
		const saved = await svc.catalog.saveProduct({
			...f,
			cost: String(f.cost).replace(/,/g, ""),
			price: String(f.price).replace(/,/g, ""),
			recipe: recipes ? f.recipe.filter((r) => r.qty > 0) : [],
		});
		if (saved) onClose();
	};

	return (
		<Modal
			id="product-modal"
			open={open}
			title={id ? "Edit Item" : "Add Item"}
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn" onClick={save}>
						Save Item
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					<div className="field">
						<label>Name *</label>
						<input className="input" id="p-name" value={f.name} onChange={set("name")} />
					</div>
					<div className="field">
						<label>Type</label>
						<select className="input" id="p-type" value={f.type} onChange={set("type")}>
							<option>Product</option>
							<option>Service</option>
						</select>
					</div>
					<div className="field">
						<label>Code</label>
						<input className="input" id="p-code" value={f.code} onChange={set("code")} />
						{barcodes && (
							<button
								id="print-product-barcode"
								type="button"
								className="btn out"
								onClick={() => (f.id ? openBarcode(f.id) : alert("Save this item first, then print its barcode label so the scanned code matches checkout."))}
							>
								Print Barcode
							</button>
						)}
					</div>
					<div className="field">
						<label>{subcats ? "Main Category *" : "Category *"}</label>
						<select className="input" id="p-category" value={f.category} onChange={set("category")}>
							<option value="">Select a category</option>
							{categories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
							<option value="__new__">＋ Add new category</option>
						</select>
						{f.category === "__new__" && (
							<input className="input" id="p-new-category" placeholder="Enter new category name" style={{ marginTop: 8 }} value={f.newCategory} onChange={set("newCategory")} autoFocus />
						)}
					</div>
					{subcats && (
						<div className="field">
							<label>Subcategory (optional)</label>
							<select className="input" id="p-subcategory" value={f.subcategory} onChange={set("subcategory")}>
								<option value="">No subcategory</option>
								{subs.map((s) => (
									<option key={s.id} value={s.name}>
										{s.name}
									</option>
								))}
							</select>
						</div>
					)}
					<div className="field">
						<label>Cost Price *</label>
						<NumberInput id="p-cost" value={f.cost} onChange={(v) => setF((x) => ({ ...x, cost: v }))} />
					</div>
					<div className="field">
						<label>Selling Price *</label>
						<NumberInput id="p-price" value={f.price} onChange={(v) => setF((x) => ({ ...x, price: v }))} />
					</div>
					<div className="field full">
						<label>Product Image</label>
						<div
							className={"image-preview" + (positioning ? " draggable-image-preview" : "")}
							id="p-image-preview"
							ref={previewRef}
							onPointerDown={onPointerDown}
							onPointerMove={onPointerMove}
							onPointerUp={endDrag}
							onPointerCancel={endDrag}
						>
							{f.image ? <img src={f.image} alt="Product preview" style={{ objectFit: f.imageFit, objectPosition: `${f.imagePositionX}% ${f.imagePositionY}%` }} /> : "No image selected"}
						</div>
						<input className="input" type="file" accept="image/*" onChange={onFile} />
						<small className="muted">Compressed into browser storage. No image is saved in the project folder.</small>
						{positioning && (
							<>
								<div className="image-position-controls drag-image-controls">
									<div>
										<strong>Position the thumbnail</strong>
										<span>Drag the image itself to choose how it appears in product cards.</span>
									</div>
									<select id="p-image-fit" className="input" aria-label="Image fit" value={f.imageFit} onChange={set("imageFit")}>
										<option value="cover">Fill thumbnail</option>
										<option value="contain">Show full image</option>
									</select>
									<button className="btn out" type="button" id="reset-product-image" onClick={() => setF((v) => ({ ...v, imageFit: "cover", imagePositionX: 50, imagePositionY: 50 }))}>
										Reset
									</button>
								</div>
								<div className="image-arrow-controls">
									<div className="image-arrow-copy">
										<strong>Position image</strong>
										<span id="image-position-readout">
											Horizontal {f.imagePositionX}% · Vertical {f.imagePositionY}%
										</span>
										<span>Use the arrows to move the image inside its thumbnail.</span>
									</div>
									<div className="image-arrow-pad" aria-label="Image position controls">
										<button className="up" type="button" onClick={() => nudge(0, -10)} aria-label="Move image up">
											↑
										</button>
										<button className="left" type="button" onClick={() => nudge(-10, 0)} aria-label="Move image left">
											←
										</button>
										<button className="reset" type="button" onClick={() => setF((v) => ({ ...v, imagePositionX: 50, imagePositionY: 50 }))}>
											Centre
										</button>
										<button className="right" type="button" onClick={() => nudge(10, 0)} aria-label="Move image right">
											→
										</button>
										<button className="down" type="button" onClick={() => nudge(0, 10)} aria-label="Move image down">
											↓
										</button>
									</div>
								</div>
							</>
						)}
					</div>
					<div className="field full">
						<label>Available Modifiers</label>
						<div className="check-list" id="p-modifiers">
							{data.modifiers.map((m) => {
								const checked = f.modifierIds.includes(m.id);
								const required = f.modifierRules[m.id] ?? m.required !== false;
								return (
									<div className="modifier-assignment" data-modifier-id={m.id} key={m.id}>
										<label>
											<input type="checkbox" checked={checked} onChange={(e) => toggleModifier(m, e.target.checked)} /> {m.name}
										</label>
										<select
											className="input"
											disabled={!checked}
											value={String(required)}
											onChange={(e) => setF((v) => ({ ...v, modifierRules: { ...v.modifierRules, [m.id]: e.target.value === "true" } }))}
										>
											<option value="true">Required for this item</option>
											<option value="false">Optional / Not required</option>
										</select>
									</div>
								);
							})}
							{!data.modifiers.length && <span className="muted">Create modifier groups first.</span>}
						</div>
					</div>
					{recipes && (
						<div className="field full">
							<label>Inventory / Stock Usage</label>
							<div className="muted">Set how much inventory this item uses each time one is sold.</div>
							<div id="p-recipe" style={{ display: "grid", gap: 8, marginTop: 8 }}>
								{data.inventory
									.filter((i) => i.id !== f.id && String(i.productId || "") !== String(f.id || "\u0000"))
									.map((i) => {
										const row = f.recipe.find((r) => r.itemId === i.id);
										return (
											<div className="modifier-assignment" key={i.id}>
												<label>
													<input type="checkbox" checked={!!row} onChange={(e) => toggleRecipe(i, e.target.checked)} /> {i.name} <span className="muted">({i.unit})</span>
												</label>
												<input
													className="input"
													type="number"
													min="0.001"
													step="0.001"
													value={row ? row.qty : 1}
													disabled={!row}
													onChange={(e) => setRecipeQty(i.id, e.target.value)}
													aria-label={i.name + " quantity per sale"}
												/>
											</div>
										);
									})}
								{!data.inventory.length && (
									<div className="print-note">Add ingredients or product stock under Inventory & Stock first, then return here to build this recipe.</div>
								)}
							</div>
						</div>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
}
