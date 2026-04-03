const API_BASE = 'api';
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let adminData = {
  allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
  blockedDays: [],
  blockedSlots: [],
  bookings: []
};

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateDisplay(ds) {
  if (!ds) return '';
  const parts = ds.split('-');
  if (parts.length !== 3) return ds;

  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return months[month - 1] + ' ' + day + ', ' + year;
}

async function apiGet(url) {
  const res = await fetch(url, {
    credentials: 'same-origin'
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function apiPost(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload || {})
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function loadDashboard() {
  const data = await apiGet(API_BASE + '/admin_dashboard.php');
  adminData = data;
  return data;
}

async function login() {
  const msg = document.getElementById('loginMsg');

  try {
    await apiPost(API_BASE + '/admin_login.php', {
      password: document.getElementById('pass').value
    });

    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('adminApp').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');

    msg.textContent = '';
    msg.className = 'muted';

    await renderAll();
  } catch (e) {
    msg.textContent = e.message || 'Wrong password.';
    msg.className = 'error';
  }
}

async function logout() {
  try {
    await apiPost(API_BASE + '/admin_logout.php', {});
  } catch (e) {
  }

  document.getElementById('adminApp').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('pass').value = '';
}

function renderDays() {
  const box = document.getElementById('days');
  box.innerHTML = '';

  WEEKDAY_NAMES.forEach(function(name, idx) {
    const label = document.createElement('label');
    label.innerHTML = '<input type="checkbox" class="dayCheck" value="' + idx + '"> ' + name;
    box.appendChild(label);
  });

  document.querySelectorAll('.dayCheck').forEach(function(cb) {
    cb.checked = adminData.allowedWeekdays.indexOf(parseInt(cb.value, 10)) !== -1;
  });

  document.getElementById('daysMsg').textContent =
    'Currently bookable: ' + adminData.allowedWeekdays.map(function(n) {
      return WEEKDAY_NAMES[n];
    }).join(', ');
}

async function saveDays() {
  const picked = Array.prototype.slice.call(document.querySelectorAll('.dayCheck:checked'))
    .map(function(cb) {
      return parseInt(cb.value, 10);
    })
    .sort(function(a, b) {
      return a - b;
    });

  const msg = document.getElementById('daysMsg');

  if (!picked.length) {
    msg.textContent = 'Choose at least one day.';
    msg.className = 'error';
    return;
  }

  try {
    await apiPost(API_BASE + '/admin_settings.php', {
      allowedWeekdays: picked
    });

    msg.textContent = 'Saved: ' + picked.map(function(n) {
      return WEEKDAY_NAMES[n];
    }).join(', ');
    msg.className = 'success';

    await renderAll();
  } catch (e) {
    msg.textContent = e.message;
    msg.className = 'error';
  }
}

async function changePassword() {
  const np = document.getElementById('newPass').value;
  const cp = document.getElementById('confirmPass').value;
  const msg = document.getElementById('passMsg');

  if (!np || np.length < 4) {
    msg.textContent = 'At least 4 characters required.';
    msg.className = 'error';
    return;
  }

  if (np !== cp) {
    msg.textContent = 'Passwords do not match.';
    msg.className = 'error';
    return;
  }

  try {
    await apiPost(API_BASE + '/admin_settings.php', {
      password: np
    });

    msg.textContent = 'Password updated.';
    msg.className = 'success';

    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
  } catch (e) {
    msg.textContent = e.message;
    msg.className = 'error';
  }
}

async function addBlockedDay() {
  const date = document.getElementById('blockDayDate').value;
  const reason = document.getElementById('blockDayReason').value.trim();

  if (!date) {
    alert('Select a date first.');
    return;
  }

  try {
    await apiPost(API_BASE + '/admin_block_day.php', {
      date: date,
      reason: reason
    });

    document.getElementById('blockDayDate').value = '';
    document.getElementById('blockDayReason').value = '';

    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

async function addBlockedSlot() {
  const date = document.getElementById('blockSlotDate').value;
  const slot = document.getElementById('blockSlotTime').value;

  if (!date) {
    alert('Select a date first.');
    return;
  }

  try {
    await apiPost(API_BASE + '/admin_block_slot.php', {
      date: date,
      slot: slot
    });

    document.getElementById('blockSlotDate').value = '';
    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

async function removeBlockedDay(id) {
  try {
    await apiPost(API_BASE + '/admin_unblock_day.php', {
      id: id
    });

    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

async function removeBlockedSlot(id) {
  try {
    await apiPost(API_BASE + '/admin_unblock_slot.php', {
      id: id
    });

    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

async function resendConfirmation(id) {
  try {
    const booking = adminData.bookings.find(function(item) {
      return String(item.id) === String(id);
    });

    if (!booking) {
      alert('Booking not found.');
      return;
    }

    await emailjs.send("service_j0mpyd6", "template_t46a8d3", {
      service: booking.service || '',
      customer_name: booking.name || '',
      customer_email: booking.email || '',
      customer_phone: booking.phone || '',
      date: booking.date || '',
      time: booking.time || '',
      vehicle: booking.car || '',
      address: booking.address || ''
    });

    alert('Confirmation resent to ' + (booking.email || 'customer') + '.');
  } catch (e) {
    console.error('EmailJS resend error:', e);
    alert('Failed to resend confirmation.');
  }
}

async function cancelBooking(id) {
  try {
    await apiPost(API_BASE + '/admin_booking_action.php', {
      action: 'cancel',
      id: id
    });

    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

async function deleteBooking(id) {
  if (!confirm('Delete this booking permanently?')) {
    return;
  }

  try {
    await apiPost(API_BASE + '/admin_booking_action.php', {
      action: 'delete',
      id: id
    });

    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

async function editBooking(id) {
  const booking = adminData.bookings.find(function(item) {
    return String(item.id) === String(id);
  });

  if (!booking) {
    alert('Booking not found.');
    return;
  }

  const newDate = prompt('New date (YYYY-MM-DD):', booking.date || '');
  if (newDate === null) return;

  const newTime = prompt('New time slot:', booking.time || '');
  if (newTime === null) return;

  try {
    await apiPost(API_BASE + '/admin_booking_action.php', {
      action: 'edit',
      id: id,
      date: (newDate || '').trim(),
      time: (newTime || '').trim()
    });

    await renderAll();
  } catch (e) {
    alert(e.message);
  }
}

function renderBlockedDays() {
  const el = document.getElementById('blockedDays');
  el.innerHTML = '';

  if (!adminData.blockedDays.length) {
    el.innerHTML = '<div class="muted">No blocked days.</div>';
    return;
  }

  adminData.blockedDays.forEach(function(day) {
    const item = document.createElement('div');
    item.className = 'item';

    const actions = document.createElement('div');
    actions.className = 'actions';

    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.addEventListener('click', function() {
      removeBlockedDay(Number(day.id));
    });

    actions.appendChild(btn);

    item.innerHTML =
      '<strong>' + escapeHtml(formatDateDisplay(day.date)) + '</strong>' +
      '<div class="small">' + escapeHtml(day.reason || 'No reason added') + '</div>';

    item.appendChild(actions);
    el.appendChild(item);
  });
}

function renderBlockedSlots() {
  const el = document.getElementById('blockedSlots');
  el.innerHTML = '';

  if (!adminData.blockedSlots.length) {
    el.innerHTML = '<div class="muted">No blocked slots.</div>';
    return;
  }

  adminData.blockedSlots.forEach(function(slot) {
    const item = document.createElement('div');
    item.className = 'item';

    const actions = document.createElement('div');
    actions.className = 'actions';

    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.addEventListener('click', function() {
      removeBlockedSlot(Number(slot.id));
    });

    actions.appendChild(btn);

    item.innerHTML =
      '<strong>' + escapeHtml(formatDateDisplay(slot.date)) + '</strong>' +
      '<div class="small">' + escapeHtml(slot.slot) + '</div>';

    item.appendChild(actions);
    el.appendChild(item);
  });
}

function renderBookings() {
  const el = document.getElementById('bookings');
  el.innerHTML = '';

  const list = adminData.bookings.slice().sort(function(a, b) {
    return String(a.date || '').localeCompare(String(b.date || ''));
  });

  if (!list.length) {
    el.innerHTML = '<div class="muted">No bookings saved yet.</div>';
    return;
  }

  list.forEach(function(booking) {
    const item = document.createElement('div');
    item.className = 'item';

    item.innerHTML =
      '<strong>' + escapeHtml(booking.name || 'Unnamed booking') +
      ' <span class="small">(' + escapeHtml(booking.status || 'confirmed') + ')</span></strong>' +
      '<div class="small">' + escapeHtml(booking.service || '') + '</div>' +
      '<div class="small">' + escapeHtml(formatDateDisplay(booking.date)) + ' — ' + escapeHtml(booking.time || '') + '</div>' +
      '<div class="small">' + escapeHtml(booking.email || '') + ' · ' + escapeHtml(booking.phone || '') + '</div>' +
      '<div class="small">' + escapeHtml(booking.car || '') + '</div>' +
      '<div class="small">' + escapeHtml(booking.address || '') + '</div>' +
      (booking.custom_request ? '<div class="small">Custom: ' + escapeHtml(booking.custom_request) + '</div>' : '');

    const actions = document.createElement('div');
    actions.className = 'actions';

    const resendBtn = document.createElement('button');
    resendBtn.textContent = 'Resend Confirmation';
    resendBtn.addEventListener('click', function() {
      resendConfirmation(String(booking.id || ''));
    });

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function() {
      editBooking(String(booking.id || ''));
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', function() {
      cancelBooking(String(booking.id || ''));
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function() {
      deleteBooking(String(booking.id || ''));
    });

    actions.appendChild(resendBtn);
    actions.appendChild(editBtn);
    actions.appendChild(cancelBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
    el.appendChild(item);
  });
}

async function renderAll() {
  await loadDashboard();
  renderDays();
  renderBlockedDays();
  renderBlockedSlots();
  renderBookings();
}

document.getElementById('pass').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    login();
  }
});

document.addEventListener('DOMContentLoaded', async function() {
  try {
    await apiGet(API_BASE + '/admin_status.php');
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('adminApp').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    await renderAll();
  } catch (e) {
  }
});