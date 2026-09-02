(function () {
  'use strict';

  var COLLECTIONS = ['appointments', 'memberships', 'prescriptions', 'medicineBatches', 'commissionPayments'];
  COLLECTIONS.forEach(function (key) { db[key] = Array.isArray(db[key]) ? db[key] : []; });

  function options(rows, selected, label) {
    return '<option value="">Select ' + esc(label) + '</option>' + rows.map(function (row) {
      return '<option value="' + esc(row.id) + '" ' + (row.id === selected ? 'selected' : '') + '>' + esc(row.name) + '</option>';
    }).join('');
  }

  function enabled() { return ['salon', 'services', 'pharmacy'].includes(db.settings.businessType); }
  function serviceMode() { return ['salon', 'services'].includes(db.settings.businessType); }
  function pharmacyMode() { return db.settings.businessType === 'pharmacy'; }
  function canManage() { var user = currentUser(); return !!user && ['owner', 'manager'].includes(user.role) && !supportModeActive(); }
  function requireManage() { if (canManage()) return true; notice('Owner or manager access is required to change business records.'); return false; }

  function installView() {
    ['owner', 'manager', 'accountant'].forEach(function (role) {
      if (roleViews[role] && !roleViews[role].includes('industry')) roleViews[role].splice(-1, 0, 'industry');
    });
    titles.industry = ['Business Tools', 'Appointments, memberships, commissions and pharmacy records'];
    if (!document.querySelector('[data-view="industry"]')) {
      var button = document.createElement('button');
      button.dataset.view = 'industry';
      button.textContent = '✦ Business Tools';
      document.querySelector('[data-view="staff"]').before(button);
    }
    if (!document.getElementById('view-industry')) {
      var section = document.createElement('section');
      section.className = 'view';
      section.id = 'view-industry';
      section.innerHTML =
        '<div id="industry-context-note" class="print-note" style="margin-bottom:14px"></div>' +
        '<div id="service-tools"><div class="grid4" id="appointment-kpis"></div>' +
          '<div class="panel" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Appointment Calendar</div><div class="muted">Schedule services and manage client visits</div></div><div class="tools"><input class="input" type="date" id="appointment-date"><button class="btn" id="new-appointment">+ Appointment</button></div></div><div class="table-wrap"><table><thead><tr><th>Time</th><th>Customer</th><th>Service</th><th>Staff</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody id="appointment-table"></tbody></table></div></div>' +
          '<div class="panel" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Customer Memberships</div><div class="muted">Plans, discounts and validity periods</div></div><button class="btn" id="new-membership">+ Membership</button></div><div class="table-wrap"><table><thead><tr><th>Customer</th><th>Membership</th><th>Discount</th><th>Period</th><th>Status</th><th></th></tr></thead><tbody id="membership-table"></tbody></table></div></div>' +
        '</div>' +
        '<div id="pharmacy-tools"><div class="grid4" id="pharmacy-kpis"></div>' +
          '<div class="panel" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Prescription Records</div><div class="muted">Customer prescription references and fulfilment status</div></div><button class="btn" id="new-prescription">+ Prescription</button></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Reference</th><th>Prescriber</th><th>Medicine / Notes</th><th>Status</th><th></th></tr></thead><tbody id="prescription-table"></tbody></table></div></div>' +
          '<div class="panel" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Medicine Batches & Expiry</div><div class="muted">Track batch quantities and upcoming expiry dates</div></div><button class="btn" id="new-batch">+ Batch</button></div><div class="table-wrap"><table><thead><tr><th>Medicine</th><th>Batch</th><th>Quantity</th><th>Received</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody id="medicine-batch-table"></tbody></table></div></div>' +
        '</div>' +
        '<div class="panel" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Staff Commissions</div><div class="muted">Set rates and calculate commission from completed sales</div></div><div class="range-fields"><input class="input" type="date" id="commission-from"><input class="input" type="date" id="commission-to"></div></div><div class="table-wrap"><table><thead><tr><th>Staff</th><th>Rate</th><th>Eligible Sales</th><th>Commission</th><th>Paid</th><th>Balance</th><th></th></tr></thead><tbody id="commission-table"></tbody></table></div></div>';
      document.querySelector('.content').append(section);
    }
    installModals();
    document.querySelectorAll('#nav button').forEach(function (button) { button.onclick = function () { go(button.dataset.view); }; });
    var date = document.getElementById('appointment-date');
    date.value = date.value || today();
    document.getElementById('commission-from').value = today().slice(0, 7) + '-01';
    document.getElementById('commission-to').value = today();
    date.onchange = renderAppointments;
    document.getElementById('commission-from').onchange = renderCommissions;
    document.getElementById('commission-to').onchange = renderCommissions;
    document.getElementById('new-appointment').onclick = function () { openAppointment(); };
    document.getElementById('new-membership').onclick = function () { openMembership(); };
    document.getElementById('new-prescription').onclick = function () { openPrescription(); };
    document.getElementById('new-batch').onclick = function () { openMedicineBatch(); };
  }

  function modal(id, title, body, saveLabel) {
    var element = document.createElement('div');
    element.className = 'modal';
    element.id = id;
    element.innerHTML = '<div class="modal-box"><div class="panel-head"><div class="panel-title">' + title + '</div><button class="btn out" data-close>×</button></div><div class="modal-body">' + body + '</div><div class="modal-foot"><button class="btn danger" data-delete>Delete</button><button class="btn gold" data-save>' + saveLabel + '</button></div></div>';
    element.querySelector('[data-close]').onclick = function () { closeModal(id); };
    document.body.append(element);
    return element;
  }

  function installModals() {
    if (document.getElementById('appointment-modal')) return;
    var appointment = modal('appointment-modal', 'Appointment', '<input type="hidden" id="a-id"><div class="form-grid"><div class="field"><label>Customer *</label><select class="input" id="a-customer"></select></div><div class="field"><label>Service *</label><select class="input" id="a-service"></select></div><div class="field"><label>Date & Time *</label><input class="input" type="datetime-local" id="a-time"></div><div class="field"><label>Staff</label><select class="input" id="a-staff"></select></div><div class="field"><label>Status</label><select class="input" id="a-status"><option>Booked</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option><option>No-show</option></select></div><div class="field full"><label>Notes</label><textarea class="input" id="a-notes" rows="3"></textarea></div></div>', 'Save Appointment');
    appointment.querySelector('[data-save]').onclick = saveAppointment;
    appointment.querySelector('[data-delete]').onclick = function () { remove('appointments', document.getElementById('a-id').value, 'appointment-modal'); };
    var membership = modal('membership-modal', 'Membership', '<input type="hidden" id="m-id"><div class="form-grid"><div class="field"><label>Customer *</label><select class="input" id="m-customer"></select></div><div class="field"><label>Membership name *</label><input class="input" id="m-name" placeholder="e.g. Gold Member"></div><div class="field"><label>Discount %</label><input class="input" type="number" min="0" max="100" id="m-discount"></div><div class="field"><label>Status</label><select class="input" id="m-status"><option>Active</option><option>Paused</option><option>Expired</option><option>Cancelled</option></select></div><div class="field"><label>Start date</label><input class="input" type="date" id="m-start"></div><div class="field"><label>End date</label><input class="input" type="date" id="m-end"></div></div>', 'Save Membership');
    membership.querySelector('[data-save]').onclick = saveMembership;
    membership.querySelector('[data-delete]').onclick = function () { remove('memberships', document.getElementById('m-id').value, 'membership-modal'); };
    var prescription = modal('prescription-modal', 'Prescription Record', '<input type="hidden" id="rx-id"><div class="form-grid"><div class="field"><label>Customer *</label><select class="input" id="rx-customer"></select></div><div class="field"><label>Date *</label><input class="input" type="date" id="rx-date"></div><div class="field"><label>Reference *</label><input class="input" id="rx-reference"></div><div class="field"><label>Prescriber</label><input class="input" id="rx-prescriber"></div><div class="field"><label>Status</label><select class="input" id="rx-status"><option>Pending</option><option>Partially Fulfilled</option><option>Fulfilled</option><option>Cancelled</option></select></div><div class="field full"><label>Medicine / Instructions</label><textarea class="input" id="rx-notes" rows="4"></textarea></div></div>', 'Save Prescription');
    prescription.querySelector('[data-save]').onclick = savePrescription;
    prescription.querySelector('[data-delete]').onclick = function () { remove('prescriptions', document.getElementById('rx-id').value, 'prescription-modal'); };
    var batch = modal('medicine-batch-modal', 'Medicine Batch', '<input type="hidden" id="batch-id"><div class="form-grid"><div class="field"><label>Inventory item *</label><select class="input" id="batch-item"></select></div><div class="field"><label>Batch number *</label><input class="input" id="batch-number"></div><div class="field"><label>Quantity *</label><input class="input" type="number" min="0" step="0.001" id="batch-qty"></div><div class="field"><label>Received date</label><input class="input" type="date" id="batch-received"></div><div class="field"><label>Expiry date *</label><input class="input" type="date" id="batch-expiry"></div><div class="field"><label>Supplier</label><input class="input" id="batch-supplier"></div></div>', 'Save Batch');
    batch.querySelector('[data-save]').onclick = saveMedicineBatch;
    batch.querySelector('[data-delete]').onclick = function () { remove('medicineBatches', document.getElementById('batch-id').value, 'medicine-batch-modal'); };
  }

  function renderIndustryTools() {
    document.getElementById('service-tools').hidden = !serviceMode();
    document.getElementById('pharmacy-tools').hidden = !pharmacyMode();
    document.getElementById('industry-context-note').textContent = serviceMode() ? 'Service tools are enabled. Existing checkout, customers and receipts remain unchanged.' : pharmacyMode() ? 'Pharmacy records and expiry tools are enabled. Existing inventory and checkout remain unchanged.' : 'Choose Salon / Spa, Services or Pharmacy in Settings to use industry tools.';
    if (serviceMode()) { renderAppointments(); renderMemberships(); }
    if (pharmacyMode()) renderPharmacy();
    renderCommissions();
    document.querySelectorAll('#view-industry button:not([data-view]),#view-industry input').forEach(function (control) { if (!canManage() && !['appointment-date', 'commission-from', 'commission-to'].includes(control.id)) control.disabled = true; });
  }

  function openAppointment(id) {
    var row = db.appointments.find(function (item) { return item.id === id; }) || {};
    document.getElementById('a-id').value = row.id || '';
    document.getElementById('a-customer').innerHTML = options(db.customers, row.customerId, 'customer');
    document.getElementById('a-service').innerHTML = options(db.products.filter(function (item) { return String(item.type).toLowerCase() === 'service'; }), row.serviceId, 'service');
    document.getElementById('a-staff').innerHTML = options(db.users.filter(function (user) { return user.active !== false; }), row.staffId, 'staff member');
    document.getElementById('a-time').value = row.time || today() + 'T09:00';
    document.getElementById('a-status').value = row.status || 'Booked';
    document.getElementById('a-notes').value = row.notes || '';
    document.querySelector('#appointment-modal [data-delete]').hidden = !id;
    openModal('appointment-modal');
  }

  function saveAppointment() {
    if (!requireManage()) return;
    var id = document.getElementById('a-id').value, customerId = document.getElementById('a-customer').value, serviceId = document.getElementById('a-service').value, time = document.getElementById('a-time').value;
    if (!customerId || !serviceId || !time) return alert('Select a customer, service, and appointment time.');
    var row = db.appointments.find(function (item) { return item.id === id; }) || { id: 'a' + Date.now(), createdAt: new Date().toISOString() };
    Object.assign(row, { customerId: customerId, serviceId: serviceId, time: time, staffId: document.getElementById('a-staff').value, status: document.getElementById('a-status').value, notes: document.getElementById('a-notes').value.trim(), updatedAt: new Date().toISOString() });
    if (!id) db.appointments.push(row);
    save(); closeModal('appointment-modal'); document.getElementById('appointment-date').value = time.slice(0, 10); renderAppointments();
  }

  function renderAppointments() {
    var date = document.getElementById('appointment-date').value || today();
    var rows = db.appointments.filter(function (item) { return item.time.slice(0, 10) === date; }).sort(function (a, b) { return a.time.localeCompare(b.time); });
    document.getElementById('appointment-kpis').innerHTML = '<div class="card"><div class="label">Appointments</div><div class="value">' + rows.length + '</div></div><div class="card"><div class="label">Confirmed</div><div class="value">' + rows.filter(function (item) { return item.status === 'Confirmed'; }).length + '</div></div><div class="card"><div class="label">Completed</div><div class="value">' + rows.filter(function (item) { return item.status === 'Completed'; }).length + '</div></div><div class="card"><div class="label">Active Schedule</div><div class="value">' + rows.filter(function (item) { return !['Cancelled', 'No-show'].includes(item.status); }).length + '</div></div>';
    document.getElementById('appointment-table').innerHTML = rows.map(function (item) {
      var service = db.products.find(function (product) { return product.id === item.serviceId; }), staff = db.users.find(function (user) { return user.id === item.staffId; });
      return '<tr><td>' + new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</td><td>' + esc(customerName(item.customerId)) + '</td><td>' + esc(service ? service.name : 'Service removed') + '</td><td>' + esc(staff ? staff.name : 'Unassigned') + '</td><td><span class="badge">' + esc(item.status) + '</span></td><td>' + esc(item.notes || '—') + '</td><td><button class="btn out" data-edit-appointment="' + esc(item.id) + '">Edit</button></td></tr>';
    }).join('') || '<tr><td colspan="7">No appointments on this date.</td></tr>';
    document.querySelectorAll('[data-edit-appointment]').forEach(function (button) { button.onclick = function () { openAppointment(button.dataset.editAppointment); }; });
  }

  function openMembership(id) {
    var row = db.memberships.find(function (item) { return item.id === id; }) || {};
    document.getElementById('m-id').value = row.id || '';
    document.getElementById('m-customer').innerHTML = options(db.customers, row.customerId, 'customer');
    document.getElementById('m-name').value = row.name || '';
    document.getElementById('m-discount').value = row.discount == null ? '' : row.discount;
    document.getElementById('m-status').value = row.status || 'Active';
    document.getElementById('m-start').value = row.start || today();
    document.getElementById('m-end').value = row.end || '';
    document.querySelector('#membership-modal [data-delete]').hidden = !id;
    openModal('membership-modal');
  }

  function saveMembership() {
    if (!requireManage()) return;
    var id = document.getElementById('m-id').value, customerId = document.getElementById('m-customer').value, name = document.getElementById('m-name').value.trim(), discount = Number(document.getElementById('m-discount').value || 0);
    if (!customerId || !name || discount < 0 || discount > 100) return alert('Select a customer and enter a valid membership and discount.');
    var row = db.memberships.find(function (item) { return item.id === id; }) || { id: 'm' + Date.now(), createdAt: new Date().toISOString() };
    Object.assign(row, { customerId: customerId, name: name, discount: discount, status: document.getElementById('m-status').value, start: document.getElementById('m-start').value, end: document.getElementById('m-end').value, updatedAt: new Date().toISOString() });
    if (!id) db.memberships.push(row);
    save(); closeModal('membership-modal'); renderMemberships();
  }

  function activeMembership(customerId) {
    return db.memberships.find(function (item) { return item.customerId === customerId && item.status === 'Active' && (!item.start || item.start <= today()) && (!item.end || item.end >= today()); });
  }

  function renderMemberships() {
    document.getElementById('membership-table').innerHTML = db.memberships.map(function (item) {
      var active = activeMembership(item.customerId);
      return '<tr><td>' + esc(customerName(item.customerId)) + '</td><td><strong>' + esc(item.name) + '</strong></td><td>' + Number(item.discount || 0) + '%</td><td>' + esc(item.start || '—') + ' → ' + esc(item.end || 'No expiry') + '</td><td><span class="badge">' + esc(active && active.id === item.id ? 'Active' : item.status) + '</span></td><td><button class="btn out" data-edit-membership="' + esc(item.id) + '">Edit</button></td></tr>';
    }).join('') || '<tr><td colspan="6">No memberships created.</td></tr>';
    document.querySelectorAll('[data-edit-membership]').forEach(function (button) { button.onclick = function () { openMembership(button.dataset.editMembership); }; });
  }

  function applyMembershipDiscount() {
    if (!requireManage()) return;
    var membership = activeMembership(document.getElementById('sale-customer').value);
    if (!membership) return;
    activeDiscount = { type: 'percent', value: Number(membership.discount || 0) };
    document.getElementById('discount-type').value = 'percent'; document.getElementById('discount-value').value = membership.discount; renderCart(); notice(membership.name + ' discount applied.');
  }

  var baseCustomerTab = renderCustomerTab;
  renderCustomerTab = function () {
    baseCustomerTab();
    var box = document.getElementById('smart-customer-checkout'), membership = activeMembership(document.getElementById('sale-customer').value);
    if (box && membership) {
      box.hidden = false;
      var note = document.createElement('div'); note.className = 'print-note'; note.style.marginTop = '8px'; note.innerHTML = '<strong>' + esc(membership.name) + '</strong> · ' + Number(membership.discount) + '% discount <button class="btn out" style="margin-left:8px">Apply</button>'; note.querySelector('button').onclick = applyMembershipDiscount; box.append(note);
    }
  };

  function openPrescription(id) {
    var row = db.prescriptions.find(function (item) { return item.id === id; }) || {};
    document.getElementById('rx-id').value = row.id || '';
    document.getElementById('rx-customer').innerHTML = options(db.customers, row.customerId, 'customer');
    document.getElementById('rx-date').value = row.date || today(); document.getElementById('rx-reference').value = row.reference || ''; document.getElementById('rx-prescriber').value = row.prescriber || ''; document.getElementById('rx-status').value = row.status || 'Pending'; document.getElementById('rx-notes').value = row.notes || '';
    document.querySelector('#prescription-modal [data-delete]').hidden = !id; openModal('prescription-modal');
  }

  function savePrescription() {
    if (!requireManage()) return;
    var id = document.getElementById('rx-id').value, customerId = document.getElementById('rx-customer').value, reference = document.getElementById('rx-reference').value.trim();
    if (!customerId || !reference) return alert('Select a customer and enter the prescription reference.');
    var row = db.prescriptions.find(function (item) { return item.id === id; }) || { id: 'rx' + Date.now(), createdAt: new Date().toISOString() };
    Object.assign(row, { customerId: customerId, reference: reference, date: document.getElementById('rx-date').value || today(), prescriber: document.getElementById('rx-prescriber').value.trim(), status: document.getElementById('rx-status').value, notes: document.getElementById('rx-notes').value.trim(), updatedAt: new Date().toISOString() });
    if (!id) db.prescriptions.push(row); save(); closeModal('prescription-modal'); renderPharmacy();
  }

  function openMedicineBatch(id) {
    var row = db.medicineBatches.find(function (item) { return item.id === id; }) || {};
    document.getElementById('batch-id').value = row.id || '';
    document.getElementById('batch-item').innerHTML = options(db.inventory, row.itemId, 'inventory item');
    document.getElementById('batch-number').value = row.batchNumber || ''; document.getElementById('batch-qty').value = row.quantity == null ? '' : row.quantity; document.getElementById('batch-received').value = row.received || today(); document.getElementById('batch-expiry').value = row.expiry || ''; document.getElementById('batch-supplier').value = row.supplier || '';
    document.querySelector('#medicine-batch-modal [data-delete]').hidden = !id; openModal('medicine-batch-modal');
  }

  function saveMedicineBatch() {
    if (!requireManage()) return;
    var id = document.getElementById('batch-id').value, itemId = document.getElementById('batch-item').value, batchNumber = document.getElementById('batch-number').value.trim(), quantity = Number(document.getElementById('batch-qty').value), expiry = document.getElementById('batch-expiry').value;
    if (!itemId || !batchNumber || !Number.isFinite(quantity) || quantity < 0 || !expiry) return alert('Select an inventory item and enter batch, quantity, and expiry.');
    var duplicate = db.medicineBatches.find(function (item) { return item.id !== id && item.itemId === itemId && item.batchNumber.toLowerCase() === batchNumber.toLowerCase(); });
    if (duplicate) return alert('That batch number already exists for this medicine.');
    var row = db.medicineBatches.find(function (item) { return item.id === id; }) || { id: 'batch' + Date.now(), createdAt: new Date().toISOString() };
    Object.assign(row, { itemId: itemId, batchNumber: batchNumber, quantity: quantity, expiry: expiry, received: document.getElementById('batch-received').value, supplier: document.getElementById('batch-supplier').value.trim(), updatedAt: new Date().toISOString() });
    if (!id) db.medicineBatches.push(row); save(); closeModal('medicine-batch-modal'); renderPharmacy();
  }

  function batchStatus(batch) {
    var days = Math.ceil((new Date(batch.expiry + 'T23:59:59') - new Date()) / 86400000);
    return days < 0 ? 'Expired' : days <= 30 ? 'Expires in ' + Math.max(0, days) + ' days' : days <= 90 ? 'Expiring soon' : 'Current';
  }

  function renderPharmacy() {
    var expired = db.medicineBatches.filter(function (item) { return batchStatus(item) === 'Expired'; }).length;
    var soon = db.medicineBatches.filter(function (item) { return batchStatus(item).indexOf('Expir') === 0 && batchStatus(item) !== 'Expired'; }).length;
    document.getElementById('pharmacy-kpis').innerHTML = '<div class="card"><div class="label">Prescriptions</div><div class="value">' + db.prescriptions.length + '</div></div><div class="card"><div class="label">Pending</div><div class="value">' + db.prescriptions.filter(function (item) { return item.status === 'Pending'; }).length + '</div></div><div class="card"><div class="label">Expiring ≤ 90 Days</div><div class="value">' + soon + '</div></div><div class="card"><div class="label">Expired Batches</div><div class="value">' + expired + '</div></div>';
    document.getElementById('prescription-table').innerHTML = db.prescriptions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (item) { return '<tr><td>' + esc(item.date) + '</td><td>' + esc(customerName(item.customerId)) + '</td><td><strong>' + esc(item.reference) + '</strong></td><td>' + esc(item.prescriber || '—') + '</td><td>' + esc(item.notes || '—') + '</td><td><span class="badge">' + esc(item.status) + '</span></td><td><button class="btn out" data-edit-prescription="' + esc(item.id) + '">Edit</button></td></tr>'; }).join('') || '<tr><td colspan="7">No prescription records.</td></tr>';
    document.getElementById('medicine-batch-table').innerHTML = db.medicineBatches.slice().sort(function (a, b) { return a.expiry.localeCompare(b.expiry); }).map(function (item) { var stock = db.inventory.find(function (entry) { return entry.id === item.itemId; }); return '<tr><td>' + esc(stock ? stock.name : 'Item removed') + '</td><td><strong>' + esc(item.batchNumber) + '</strong></td><td>' + Number(item.quantity).toLocaleString() + '</td><td>' + esc(item.received || '—') + '</td><td>' + esc(item.expiry) + '</td><td><span class="badge">' + esc(batchStatus(item)) + '</span></td><td><button class="btn out" data-edit-batch="' + esc(item.id) + '">Edit</button></td></tr>'; }).join('') || '<tr><td colspan="7">No medicine batches.</td></tr>';
    document.querySelectorAll('[data-edit-prescription]').forEach(function (button) { button.onclick = function () { openPrescription(button.dataset.editPrescription); }; });
    document.querySelectorAll('[data-edit-batch]').forEach(function (button) { button.onclick = function () { openMedicineBatch(button.dataset.editBatch); }; });
  }

  function remove(collection, id, modalId) {
    if (!requireManage()) return;
    if (!id || !confirm('Delete this record?')) return;
    db[collection] = db[collection].filter(function (item) { return item.id !== id; }); save(); closeModal(modalId); renderIndustryTools();
  }

  function commissionSales(userId, from, to) {
    return db.sales.filter(function (sale) { return sale.staffId === userId && sale.date >= from && sale.date <= to && !['voided', 'refunded'].includes(sale.status); });
  }

  function renderCommissions() {
    var from = document.getElementById('commission-from').value || '0000-01-01', to = document.getElementById('commission-to').value || '9999-12-31';
    document.getElementById('commission-table').innerHTML = db.users.map(function (user) {
      var sales = commissionSales(user.id, from, to), revenue = sales.reduce(function (sum, sale) { return sum + Number(sale.total || 0); }, 0), commission = revenue * Number(user.commissionRate || 0) / 100, paid = db.commissionPayments.filter(function (payment) { return payment.userId === user.id && payment.from === from && payment.to === to; }).reduce(function (sum, payment) { return sum + Number(payment.amount || 0); }, 0), balance = Math.max(0, commission - paid);
      return '<tr><td><strong>' + esc(user.name) + '</strong><br><span class="muted">' + esc(user.role) + '</span></td><td><input class="input commission-rate" style="width:90px" type="number" min="0" max="100" step="0.01" value="' + Number(user.commissionRate || 0) + '" data-user="' + esc(user.id) + '">%</td><td>' + money(revenue) + '<br><span class="muted">' + sales.length + ' sale(s)</span></td><td>' + money(commission) + '</td><td>' + money(paid) + '</td><td><strong>' + money(balance) + '</strong></td><td><button class="btn out commission-paid" data-user="' + esc(user.id) + '" data-amount="' + balance + '" ' + (balance <= 0 ? 'disabled' : '') + '>Mark Paid</button></td></tr>';
    }).join('') || '<tr><td colspan="7">No staff users.</td></tr>';
    document.querySelectorAll('.commission-rate').forEach(function (input) { input.disabled = !canManage(); input.onchange = function () { if (!requireManage()) return; var user = db.users.find(function (item) { return item.id === input.dataset.user; }); if (user) { user.commissionRate = Math.max(0, Math.min(100, Number(input.value || 0))); save(); renderCommissions(); } }; });
    document.querySelectorAll('.commission-paid').forEach(function (button) { button.onclick = function () { recordCommissionPayment(button.dataset.user, Number(button.dataset.amount)); }; });
  }

  function recordCommissionPayment(userId, amount) {
    if (!requireManage()) return;
    if (amount <= 0 || !confirm('Record ' + money(amount) + ' as paid?')) return;
    db.commissionPayments.push({ id: 'cp' + Date.now(), userId: userId, amount: amount, from: document.getElementById('commission-from').value, to: document.getElementById('commission-to').value, paidAt: new Date().toISOString(), recordedBy: currentUserId }); save(); renderCommissions();
  }

  var baseGo = go;
  go = function (view) { baseGo(view); if (view === 'industry' && document.querySelector('#view-industry.active')) renderIndustryTools(); };
  var baseAccess = applyUserAccess;
  applyUserAccess = function () { baseAccess(); var button = document.querySelector('[data-view="industry"]'); if (button) button.style.display = canView('industry') && enabled() ? 'block' : 'none'; };
  var baseBusinessMode = applyBusinessModeUI;
  applyBusinessModeUI = function () { baseBusinessMode(); var button = document.querySelector('[data-view="industry"]'); if (button) button.style.display = canView('industry') && enabled() ? 'block' : 'none'; if (document.querySelector('#view-industry.active') && !enabled()) go('dashboard'); };

  installView();
  save();
  applyUserAccess();
  applyBusinessModeUI();
})();
