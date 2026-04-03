
const API_BASE = 'api';
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var chatOpen = false, step = 'idle', booking = {}, typingEl = null;
var ALL_SLOTS = ['Morning (9am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-7pm)'];
var PRICING = {
  'Basic':    { 'Coupe/Sedan': 79,  'SUV': 99  },
  'Standard': { 'Coupe/Sedan': 149, 'SUV': 179 },
  'Premium':  { 'Coupe/Sedan': 249, 'SUV': 289 }
};
var scheduleData = { blockedDays: [], blockedSlots: [], allowedWeekdays: [0,1,2,3,4,5,6], bookedSlots: [] };

async function apiGet(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
async function apiPost(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
async function refreshSchedule() {
  const data = await apiGet(API_BASE + '/public_config.php');
  scheduleData = {
    blockedDays: Array.isArray(data.blockedDays) ? data.blockedDays : [],
    blockedSlots: Array.isArray(data.blockedSlots) ? data.blockedSlots : [],
    allowedWeekdays: Array.isArray(data.allowedWeekdays) && data.allowedWeekdays.length ? data.allowedWeekdays.map(Number).sort((a,b)=>a-b) : [0,1,2,3,4,5,6],
    bookedSlots: Array.isArray(data.bookedSlots) ? data.bookedSlots : []
  };
  return scheduleData;
}
function getWeekdayNumber(ds) { return new Date(ds + 'T12:00:00').getDay(); }
function isAllowedWeekday(ds) { return scheduleData.allowedWeekdays.indexOf(getWeekdayNumber(ds)) !== -1; }
function getAllowedWeekdayNames() { return scheduleData.allowedWeekdays.map(function(n){ return WEEKDAY_NAMES[n]; }); }
function isDayBlocked(ds) { return scheduleData.blockedDays.some(function(d){ return d.date === ds; }); }
function isSlotBlocked(ds, slot) { return scheduleData.blockedSlots.some(function(s){ return s.date === ds && s.slot === slot; }); }
function isBookedSlot(ds, slot) { return scheduleData.bookedSlots.some(function(s){ return s.date === ds && s.slot === slot; }); }
function getAvailableSlots(ds) { return ALL_SLOTS.filter(function(s){ return !isSlotBlocked(ds, s) && !isBookedSlot(ds, s); }); }
function formatDateDisplay(ds) {
  if (!ds) return '';
  const [y, m, d] = ds.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(m,10)-1] + ' ' + parseInt(d,10) + ', ' + y;
}
function parseDateInput(text) {
  try {
    const d = new Date(text);
    if (!isNaN(d.getTime())) {
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }
  } catch(e) {}
  return null;
}
function hasValue(v) { return typeof v === 'string' ? v.trim() !== '' : !!v; }
function getFirstName(name) { return (name || '').trim().split(' ')[0] || ''; }
function isValidEmail(email) {
  email = (email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  if (/\.\./.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  if (parts[0].length < 1 || parts[1].length < 3) return false;
  if (parts[1].startsWith('-') || parts[1].endsWith('-')) return false;
  return true;
}
function isValidPhone(phone) { return ((phone || '').replace(/\D/g,'').length >= 10); }
function createBotChallenge() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  booking.botChallenge = { question: 'Anti-bot check: what is ' + a + ' + ' + b + '?', answer: String(a + b) };
}

function toggleChat() {
  chatOpen = !chatOpen;
  var win = document.getElementById('chat-win');
  var btn = document.getElementById('chat-toggle');
  if (chatOpen) {
    win.classList.add('open');
    btn.innerHTML = '✕';
    if (!document.getElementById('chat-msgs').hasChildNodes()) startChat();
  } else {
    win.classList.remove('open');
    btn.innerHTML = '💬';
  }
}
function openChat() { if (!chatOpen) toggleChat(); }
function setStep(nextStep) { step = nextStep; toggleDatePicker(nextStep === 'date'); }
function toggleDatePicker(show) {
  var row = document.getElementById('date-picker-row');
  var input = document.getElementById('chat-date-input');
  if (!row || !input) return;
  if (show) row.classList.add('show');
  else { row.classList.remove('show'); input.value = ''; }
}
function handleDatePick(value) {
  if (!value) return;
  var d = new Date(value + 'T12:00:00');
  var pretty = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  handleInput(pretty, true);
}
function bookService(svc) {
  booking = { serviceTier: svc };
  setStep('vehicle_type');
  openChat();
  var msgs = document.getElementById('chat-msgs');
  if (!msgs.hasChildNodes()) botSay('Hi! I see you would like the ' + svc + ' package — excellent choice!\n\nIs your vehicle a Coupe/Sedan or an SUV?');
  else botSay('Switching to the ' + svc + ' package! Is your vehicle a Coupe/Sedan or an SUV?');
  setQuick(['Coupe/Sedan', 'SUV']);
}
async function startChat() {
  setStep('start');
  booking = {};
  try { await refreshSchedule(); } catch (e) { console.error(e); }
  botSay('Hi! Welcome to Ian & Adrian Car Cleaning.\n\nWhich service are you interested in?');
  setQuick(['Basic', 'Standard', 'Premium', 'Custom']);
}
function addMsg(text, who) {
  var msgs = document.getElementById('chat-msgs');
  var div = document.createElement('div');
  div.className = 'bubble ' + who;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function showTyping() {
  var msgs = document.getElementById('chat-msgs');
  typingEl = document.createElement('div');
  typingEl.className = 'typing';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }
function botSay(text, delay) {
  delay = delay || 650;
  showTyping();
  setTimeout(function(){ hideTyping(); addMsg(text, 'bot'); }, delay);
}
function setQuick(opts, delay) {
  delay = delay || 720;
  setTimeout(function() {
    var q = document.getElementById('quick-btns');
    if (!q) return;
    q.innerHTML = '';
    opts.forEach(function(o) {
      var b = document.createElement('button');
      b.className = 'qbtn';
      b.textContent = o;
      b.onclick = function(){ handleInput(o); };
      q.appendChild(b);
    });
  }, delay);
}
function sendMsg() {
  var inp = document.getElementById('chat-input');
  var val = inp.value.trim();
  if (!val) return;
  inp.value = '';
  handleInput(val);
}
function updateBookedService() {
  if (booking.serviceTier === 'Custom' && hasValue(booking.vehicleType)) {
    booking.service = 'Custom - ' + booking.vehicleType + ' - Price discussed on phone';
    return;
  }
  if (hasValue(booking.serviceTier) && hasValue(booking.vehicleType) && PRICING[booking.serviceTier] && PRICING[booking.serviceTier][booking.vehicleType]) {
    booking.service = booking.serviceTier + ' - ' + booking.vehicleType + ' - $' + PRICING[booking.serviceTier][booking.vehicleType];
  }
}
function moveToNextNeededStep() {
  if (!hasValue(booking.serviceTier)) { setStep('start'); botSay('Which service are you interested in?'); setQuick(['Basic', 'Standard', 'Premium', 'Custom']); return; }
  if (!hasValue(booking.vehicleType)) { setStep('vehicle_type'); botSay('Is your vehicle a Coupe/Sedan or an SUV?'); setQuick(['Coupe/Sedan', 'SUV']); return; }
  updateBookedService();
  if (booking.serviceTier === 'Custom' && !hasValue(booking.customRequest)) { setStep('custom_request'); botSay('Tell us what you are looking for, and we can work out the final price on the phone.'); return; }
  if (!hasValue(booking.name)) { setStep('name'); botSay('What is your full name?'); return; }
  if (!hasValue(booking.email)) { setStep('email'); botSay('Nice to meet you, ' + getFirstName(booking.name) + '! What is your email address?\n\nWe will send your booking confirmation there.'); return; }
  if (!hasValue(booking.phone)) { setStep('phone'); botSay('And what is the best phone number to reach you?'); return; }
  if (!hasValue(booking.date)) { setStep('date'); botSay('What date works best for you? You can type it or use the date picker below.'); setQuick(['This Saturday', 'Next Monday', 'Next Saturday']); return; }
  if (!hasValue(booking.time)) { setStep('time'); var avail = booking.parsedDate ? getAvailableSlots(booking.parsedDate) : ALL_SLOTS; botSay('What time works best?'); setQuick(avail.length ? avail : ['Start over']); return; }
  if (!hasValue(booking.car)) { setStep('car'); botSay('Almost done! What is the year, make, and model of your ' + booking.vehicleType.toLowerCase() + '?'); return; }
  if (!hasValue(booking.address)) { setStep('address'); botSay('What address should we come to?\n\nIf you would rather not put it in chat, tap "Discuss on phone call."'); setQuick(['Discuss on phone call']); return; }
  if (!hasValue(booking.botVerified)) { createBotChallenge(); setStep('bot_check'); botSay(booking.botChallenge.question + '\n\nType the answer to continue.'); return; }
  setStep('confirm');
  var summary = 'Here is your booking summary:\n\n' +
    'Service: ' + booking.service + '\n' +
    'Vehicle Type: ' + booking.vehicleType + '\n' +
    'Name: ' + booking.name + '\n' +
    'Email: ' + booking.email + '\n' +
    'Phone: ' + booking.phone + '\n' +
    'Date: ' + booking.date + '\n' +
    'Time: ' + booking.time + '\n' +
    'Vehicle: ' + booking.car + '\n' +
    'Address: ' + booking.address + '\n\n' +
    'Shall I confirm this?';
  botSay(summary, 800);
  setQuick(['Yes, confirm!', 'Start over'], 900);
}

function handleInput(text) {
  addMsg(text, 'user');
  document.getElementById('quick-btns').innerHTML = '';
  if (text === 'Start over') { booking = {}; setStep('start'); setTimeout(function(){ startChat(); }, 300); return; }
  setTimeout(async function() {
    if (step === 'start') {
      if (hasValue(booking.serviceTier)) { moveToNextNeededStep(); return; }
      if (text.indexOf('Basic') !== -1) booking.serviceTier = 'Basic';
      else if (text.indexOf('Standard') !== -1) booking.serviceTier = 'Standard';
      else if (text.indexOf('Premium') !== -1) booking.serviceTier = 'Premium';
      else if (text.indexOf('Custom') !== -1) booking.serviceTier = 'Custom';
      else booking.serviceTier = text;
      moveToNextNeededStep();
    } else if (step === 'vehicle_type') {
      if (text.indexOf('SUV') !== -1) booking.vehicleType = 'SUV';
      else if (text.indexOf('Coupe') !== -1 || text.indexOf('Sedan') !== -1) booking.vehicleType = 'Coupe/Sedan';
      else { botSay('Please choose Coupe/Sedan or SUV.'); setQuick(['Coupe/Sedan', 'SUV']); return; }
      updateBookedService();
      moveToNextNeededStep();
    } else if (step === 'custom_request') {
      booking.customRequest = text;
      moveToNextNeededStep();
    } else if (step === 'name') {
      booking.name = text;
      moveToNextNeededStep();
    } else if (step === 'email') {
      if (!isValidEmail(text)) { botSay('Please enter a valid email address.'); return; }
      booking.email = text.trim();
      moveToNextNeededStep();
    } else if (step === 'phone') {
      if (!isValidPhone(text)) { botSay('Please enter a valid phone number with at least 10 digits.'); return; }
      booking.phone = text;
      moveToNextNeededStep();
    } else if (step === 'date') {
      await refreshSchedule().catch(function(e){ console.error(e); });
      var parsed = parseDateInput(text) || parseDateInput('2026 ' + text);
      if (!parsed) { botSay('Please enter a real date.'); return; }
      var today = new Date();
      today.setHours(0,0,0,0);
      var picked = new Date(parsed + 'T12:00:00');
      if (picked < today) { botSay('Please choose a future date.'); return; }
      if (!isAllowedWeekday(parsed)) {
        botSay('Sorry, we are only taking bookings on: ' + getAllowedWeekdayNames().join(', ') + '.\n\nPlease pick another date.');
        setQuick(['This Saturday', 'Next Monday', 'Next Saturday']);
        return;
      }
      if (isDayBlocked(parsed)) {
        botSay('Sorry, we are not available on ' + formatDateDisplay(parsed) + '.\n\nPlease pick a different date.');
        setQuick(['This Saturday', 'Next Monday', 'Next Saturday']);
        return;
      }
      booking.date = text;
      booking.parsedDate = parsed;
      var avail = getAvailableSlots(parsed);
      if (!avail.length) {
        botSay('Sorry, all time slots on ' + formatDateDisplay(parsed) + ' are already taken. Please try another date.');
        setStep('date');
        setQuick(['This Saturday', 'Next Monday', 'Next Saturday']);
        return;
      }
      setStep('time');
      var unavailable = ALL_SLOTS.filter(function(s){ return avail.indexOf(s) === -1; });
      var msg = 'What time works best?';
      if (unavailable.length) msg += '\n\nUnavailable that day: ' + unavailable.join(', ');
      botSay(msg);
      setQuick(avail);
    } else if (step === 'time') {
      var availNow = booking.parsedDate ? getAvailableSlots(booking.parsedDate) : ALL_SLOTS;
      if (availNow.indexOf(text) === -1) { botSay('Please choose one of the available time slots.'); setQuick(availNow.length ? availNow : ['Start over']); return; }
      booking.time = text;
      moveToNextNeededStep();
    } else if (step === 'car') {
      booking.car = text;
      moveToNextNeededStep();
    } else if (step === 'address') {
      booking.address = text === 'Discuss on phone call' ? 'To be discussed on phone call' : text;
      moveToNextNeededStep();
    } else if (step === 'bot_check') {
      if (String(text).trim() !== booking.botChallenge.answer) {
        createBotChallenge();
        botSay('That answer was not correct. ' + booking.botChallenge.question);
        return;
      }
      booking.botVerified = true;
      moveToNextNeededStep();
    } else if (step === 'confirm') {
      if (text.indexOf('confirm') !== -1 || text.indexOf('Yes') !== -1) {
        setStep('done');
        botSay('Sending your booking request now...', 450);
        setTimeout(function(){ processBooking(); }, 900);
      } else {
        setStep('idle');
        botSay('No problem! Feel free to start a new booking anytime.', 500);
        setQuick(['Start over']);
      }
    } else {
      moveToNextNeededStep();
    }
  }, 400);
}

async function processBooking() {
  try {
    await refreshSchedule();
    if (booking.parsedDate && getAvailableSlots(booking.parsedDate).indexOf(booking.time) === -1) {
      botSay('Sorry, that slot was just taken. Please pick another time.');
      setStep('time');
      setQuick(getAvailableSlots(booking.parsedDate));
      return;
    }
    const saved = await apiPost(API_BASE + '/create_booking.php', {
      service: booking.service || booking.serviceTier || '',
      service_tier: booking.serviceTier || '',
      vehicle_type: booking.vehicleType || '',
      car: booking.car || '',
      custom_request: booking.customRequest || '',
      name: booking.name || '',
      email: booking.email || '',
      phone: booking.phone || '',
      date: booking.parsedDate || parseDateInput(booking.date) || booking.date || '',
      time: booking.time || '',
      address: booking.address || ''
    });
    booking.bookingId = saved.booking.id;
    await refreshSchedule().catch(function(){});

    if (typeof emailjs === 'undefined') {
      botSay('Your time slot has been saved, but the email service is not available right now. Ian or Adrian should still follow up manually.', 500);
      showBookingSummaryCard();
      return;
    }
    try {
      await emailjs.send('service_j0mpyd6', 'template_t46a8d3', {
        booking_id: booking.bookingId || '',
        service: booking.service || booking.serviceTier || '',
        service_tier: booking.serviceTier || '',
        vehicle_type: booking.vehicleType || '',
        vehicle: booking.car || '',
        custom_request: booking.customRequest || '',
        customer_name: booking.name || '',
        customer_email: booking.email || '',
        customer_phone: booking.phone || '',
        date: booking.date || formatDateDisplay(saved.booking.date || ''),
        time: booking.time || '',
        address: booking.address || ''
      });
      botSay('Booking confirmed, ' + getFirstName(booking.name) + '!\n\nYour request was sent successfully. Ian or Adrian will reach out soon to confirm everything. Thanks for choosing Ian & Adrian Car Cleaning!', 700);
    } catch (error) {
      console.error('EmailJS Error:', error);
      botSay('Your booking was saved, but there was a problem sending the email automatically. Please screenshot the confirmation below and follow up by phone or email just in case.', 700);
    }
    setTimeout(function(){ showBookingSummaryCard(); }, 1500);
  } catch (error) {
    console.error(error);
    if (String(error.message || '').toLowerCase().indexOf('taken') !== -1) {
      await refreshSchedule().catch(function(){});
      botSay('Sorry, that slot was just taken. Please pick another time.');
      setStep('time');
      setQuick(getAvailableSlots(booking.parsedDate));
    } else {
      botSay('Sorry, there was a problem saving your booking. Please try again or contact us directly.', 700);
      setStep('confirm');
      setQuick(['Yes, confirm!', 'Start over']);
    }
  }
}
function showBookingSummaryCard() {
  var msgs = document.getElementById('chat-msgs');
  var card = document.createElement('div');
  card.style.cssText = 'background:#f0f7fd;border:1.5px solid #4a9eca44;border-radius:10px;padding:.85rem;margin:.4rem 0;font-size:.8rem;line-height:1.7;color:#333;align-self:stretch;max-width:100%';
  card.innerHTML =
    '<div style="font-weight:600;margin-bottom:.4rem;color:#2a6e9e">Booking Reference</div>' +
    '<b>ID:</b> ' + (booking.bookingId || '-') + '<br>' +
    '<b>Service:</b> ' + (booking.service || '-') + '<br>' +
    '<b>Date:</b> ' + (booking.date || '-') + '<br>' +
    '<b>Time:</b> ' + (booking.time || '-') + '<br>' +
    '<b>Name:</b> ' + (booking.name || '-') + '<br>' +
    '<b>Email:</b> ' + (booking.email || '-') + '<br>' +
    '<b>Phone:</b> ' + (booking.phone || '-') + '<br>' +
    (booking.customRequest ? '<b>Custom Request:</b> ' + booking.customRequest + '<br>' : '') +
    '<b>Address:</b> ' + (booking.address || '-') + '<br>' +
    '<div style="margin-top:.5rem;color:#888;font-size:.75rem">Screenshot this as your confirmation.</div>';
  msgs.appendChild(card);
  msgs.scrollTop = msgs.scrollHeight;
}

document.addEventListener('DOMContentLoaded', async function() {
  setTimeout(function() {
    document.querySelectorAll('.hero-car').forEach(function(car, index) {
      setTimeout(function() { car.classList.add('in-view'); }, index * 180);
    });
  }, 180);
  var input = document.getElementById('chat-input');
  if (input) input.addEventListener('keydown', function(e){ if (e.key === 'Enter') sendMsg(); });
  try { await refreshSchedule(); } catch (e) { console.error(e); }
});
