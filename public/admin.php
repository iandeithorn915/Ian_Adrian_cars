<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Ian & Adrian Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
window.addEventListener('load', function () {
  if (typeof emailjs !== 'undefined') {
    emailjs.init('RTkLWkQM1GGnsat0N');
    console.log('EmailJS loaded');
  } else {
    console.log('EmailJS failed to load');
  }
});
</script>

<style>
:root{--bg:#f7f6f2;--white:#ffffff;--black:#0f0f0f;--dark:#1a1a1a;--blue:#4a9eca;--muted:#888;--border:#e5e3dc;--shadow:0 10px 30px rgba(0,0,0,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--dark);padding:2rem}
.wrap{max-width:1100px;margin:0 auto}
.card{background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:1.25rem;margin-bottom:1.1rem}
h1{font-family:'Playfair Display',serif;font-size:2rem;margin-bottom:.35rem}
p.sub{color:var(--muted);margin-bottom:1.4rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}
h2{font-size:1rem;margin-bottom:.8rem}
input,select,button,textarea{font:inherit}
input,select,textarea{width:100%;padding:.75rem .85rem;border:1px solid var(--border);border-radius:8px;background:#fff}
button{background:var(--black);color:#fff;border:none;padding:.75rem 1rem;border-radius:8px;cursor:pointer}
button:hover{background:var(--blue)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
.stack{display:flex;flex-direction:column;gap:.75rem}
.muted{color:var(--muted);font-size:.9rem}
.list{display:flex;flex-direction:column;gap:.6rem}
.item{border:1px solid var(--border);border-radius:10px;padding:.85rem;background:#fcfcfb}
.item strong{display:block;margin-bottom:.2rem}
.item .actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.65rem}
.small{font-size:.85rem}
.success{color:#2c8a55}
.error{color:#c0392b}
.day-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.55rem}
.day-grid label{display:flex;gap:.45rem;align-items:center;border:1px solid var(--border);padding:.6rem .7rem;border-radius:8px;background:#faf9f7}
.topbar{display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem}
.hidden{display:none}
@media(max-width:640px){body{padding:1rem}.row{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <div>
      <h1>Ian & Adrian Admin</h1>
      <p class="sub">Keep this file private. Use it to manage bookings, schedule rules, and password.</p>
    </div>
    <button id="logoutBtn" class="hidden" onclick="logout()">Log out</button>
  </div>

  <div id="loginCard" class="card">
    <h2>Admin Login</h2>
    <div class="stack">
      <input type="password" id="pass" placeholder="Admin password"/>
      <button onclick="login()">Open Admin</button>
      <div id="loginMsg" class="muted">Default password: admin123</div>
    </div>
  </div>

  <div id="adminApp" class="hidden">
    <div class="grid">
      <div class="card">
        <h2>Allowed Booking Days</h2>
        <div class="day-grid" id="days"></div>
        <div class="actions" style="margin-top:.8rem"><button onclick="saveDays()">Save Booking Days</button></div>
        <div id="daysMsg" class="muted" style="margin-top:.6rem"></div>
      </div>

      <div class="card">
        <h2>Change Password</h2>
        <div class="stack">
          <input type="password" id="newPass" placeholder="New password"/>
          <input type="password" id="confirmPass" placeholder="Confirm password"/>
          <button onclick="changePassword()">Update Password</button>
          <div id="passMsg" class="muted"></div>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Block a Whole Day</h2>
        <div class="stack">
          <input type="date" id="blockDayDate"/>
          <input type="text" id="blockDayReason" placeholder="Reason (optional)"/>
          <button onclick="addBlockedDay()">Block Day</button>
        </div>
      </div>

      <div class="card">
        <h2>Block a Time Slot</h2>
        <div class="stack">
          <input type="date" id="blockSlotDate"/>
          <select id="blockSlotTime">
            <option>Morning (9am-12pm)</option>
            <option>Afternoon (12pm-4pm)</option>
            <option>Evening (4pm-7pm)</option>
          </select>
          <button onclick="addBlockedSlot()">Block Slot</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Confirmed Bookings</h2>
      <p class="muted">Bookings auto-remove those slots from the public chatbot. You can resend, edit, cancel, or delete any booking here.</p>
      <div id="bookings" class="list" style="margin-top:.9rem"></div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Blocked Days</h2>
        <div id="blockedDays" class="list"></div>
      </div>

      <div class="card">
        <h2>Blocked Slots</h2>
        <div id="blockedSlots" class="list"></div>
      </div>
    </div>
  </div>
</div>

<script src="assets/admin.js"></script>
</body>
</html>