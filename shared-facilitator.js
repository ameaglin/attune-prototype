const facilitatorSections = [
 {
  title: "Welcome, Agenda & Opening Prayer",
  subtitle: "~10 min · Set the tone and open in prayer",
  text: `
   <div class="guide-block"><div class="label">Objective</div>
   <p>Welcome the group, walk through tonight's agenda, and open the gathering in silence and prayer.</p></div>
   <div class="guide-block"><div class="label">What to Say</div>
   <p>Welcome everyone. Share the flow for the hour — warm-up, teaching, KRL time, breakouts, and closing. Invite a moment of silence before opening prayer.</p></div>
   <div class="guide-block"><div class="label">Facilitator Notes</div>
   <ul><li>Keep it brief — people are arriving</li><li>Anyone can lead; encourage rotation</li></ul></div>`
 },
 {
  title: "Guidance for Group Dynamics",
  subtitle: "~5 min · Set norms for the gathering",
  text: `
   <div class="guide-block"><div class="label">Objective</div>
   <p>Establish a safe, attentive space before exercises begin.</p></div>
   <div class="guide-block"><div class="label">Key Reminders</div>
   <ul><li>Listen without fixing or advising</li><li>Share only what you're comfortable sharing</li><li>Honor confidentiality within the group</li></ul></div>`
 },
 {
  title: "5 Senses Warm Up",
  subtitle: "~10 min · Get connected and release tension",
  text: `
   <div class="guide-block"><div class="label">Objective</div>
   <p>Help the group arrive physically and emotionally through a guided sensory exercise.</p></div>
   <div class="guide-block"><div class="label">Exercise Instructions</div>
   <p>Guide the group to notice one thing they see, hear, feel, smell, and taste. Go slowly — pause between each sense.</p></div>
   <div class="guide-block"><div class="label">Facilitator Tips</div>
   <ul><li>Model calm pacing</li><li>Invite deep breaths between rounds</li></ul></div>`
 },
 {
  title: "Breakouts for Sharing",
  subtitle: "~20 min · Groups of 3–5 share KRL & reflections",
  text: `
   <div class="guide-block"><div class="label">Objective</div>
   <p>Create space for each person to share their KRL exercise and reflection from prep.</p></div>
   <div class="guide-block"><div class="label">Group Setup</div>
   <ul><li>Break into groups of 3–5</li><li>Each person shares their KRL and prep reflection</li><li>Listeners reflect back what they heard</li></ul></div>
   <div class="guide-block"><div class="label">Sharing Prompts</div>
   <ul><li>What stood out from your KRL this week?</li><li>What do you want the group to hold with you?</li></ul></div>`
 },
 {
  title: "Large Group Debrief",
  subtitle: "~10 min · Reconvene and synthesize",
  text: `
   <div class="guide-block"><div class="label">Objective</div>
   <p>Bring the full group back together to name themes and close the learning loop.</p></div>
   <div class="guide-block"><div class="label">Debrief Questions</div>
   <ul><li>What themes emerged across the breakouts?</li><li>Was there anything surprising or unifying?</li></ul></div>`
 },
 {
  title: "Closing",
  subtitle: "~5 min · Send forth in prayer",
  text: `
   <div class="guide-block"><div class="label">Objective</div>
   <p>Close the gathering with gratitude and a brief commissioning prayer.</p></div>
   <div class="guide-block"><div class="label">Closing Outline</div>
   <ul><li>Thank the group for their presence</li><li>Name one takeaway from tonight</li><li>Close in prayer and send forth</li></ul></div>`
 }
];

let guideSectionIdx = -1;

function openGuideSection(idx) {
 guideSectionIdx = idx;
 const s = facilitatorSections[idx];
 document.getElementById('guide-num').textContent = idx + 1;
 document.getElementById('guide-title').textContent = s.title;
 document.getElementById('guide-subtitle').textContent = s.subtitle;
 document.getElementById('guide-text').innerHTML = s.text;
 const textBtn = document.querySelector('#guide-detail .guide-mode-btn');
 if (textBtn) switchGuideMode(textBtn, 'text');
 setAppNavActive('guide');
 if (typeof onGuideSectionOpen === 'function') onGuideSectionOpen(idx);
 if (typeof window.show === 'function') window.show('guide-detail');
 else if (typeof slideNav !== 'undefined') slideNav.syncFromShow('guide-detail');
}

function goGuideAgenda() {
 guideSectionIdx = -1;
 setAppNavActive('guide');
 if (typeof onGuideAgendaOpen === 'function') onGuideAgendaOpen();
 if (typeof window.show === 'function') window.show('guide-agenda');
 else if (typeof slideNav !== 'undefined') slideNav.syncFromShow('guide-agenda');
}

function guideNextSection() {
 if (guideSectionIdx < facilitatorSections.length - 1) openGuideSection(guideSectionIdx + 1);
 else goGuideAgenda();
}

function guidePrevSection() {
 if (guideSectionIdx > 0) openGuideSection(guideSectionIdx - 1);
 else goGuideAgenda();
}

function switchGuideMode(btn, mode) {
 document.querySelectorAll('#guide-detail .guide-mode-btn').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 document.getElementById('guide-text').style.display = mode === 'text' ? 'block' : 'none';
 document.getElementById('guide-audio').style.display = mode === 'audio' ? 'block' : 'none';
}

function renderGuideAgenda() {
 const el = document.getElementById('guide-agenda-list');
 if (!el) return;
 el.innerHTML = facilitatorSections.map((s, i) => `
  <div class="guide-item" onclick="openGuideSection(${i})">
   <div class="guide-num">${i + 1}</div>
   <div class="guide-text"><div class="title">${s.title}</div><div class="sub">${s.subtitle}</div></div>
  </div>`).join('');
}

function setAppNavActive(tab) {
 document.querySelectorAll('.app-nav-item').forEach(item => {
  item.classList.toggle('active', item.dataset.tab === tab);
 });
}

function initAppNav(defaultTab) {
 renderGuideAgenda();
 setAppNavActive(defaultTab || 'today');
}

function createSlideNav(appScreens) {
 const agendaIdx = appScreens.indexOf('guide-agenda');
 const totalSlides = agendaIdx === -1
  ? appScreens.length
  : appScreens.length + facilitatorSections.length;
 let current = 0;

 function showSlide(idx) {
  current = idx;
  if (agendaIdx === -1 || idx < agendaIdx) {
   window.show(appScreens[idx]);
  } else if (idx === agendaIdx) {
   goGuideAgenda();
  } else {
   openGuideSection(idx - agendaIdx - 1);
  }
  updateSlideNav();
 }

 function navNext() { if (current < totalSlides - 1) showSlide(current + 1); }
 function navPrev() { if (current > 0) showSlide(current - 1); }

 function syncFromShow(id) {
  if (agendaIdx === -1) {
   const idx = appScreens.indexOf(id);
   if (idx !== -1) current = idx;
  } else if (id === 'guide-detail' && guideSectionIdx >= 0) {
   current = agendaIdx + 1 + guideSectionIdx;
  } else if (id === 'guide-agenda') {
   current = agendaIdx;
  } else {
   const idx = appScreens.indexOf(id);
   if (idx !== -1) current = idx;
  }
  updateSlideNav();
 }

 function updateSlideNav() {
  const prev = document.querySelector('.slide-prev');
  const next = document.querySelector('.slide-next');
  const counter = document.getElementById('slide-counter');
  if (prev) prev.disabled = current === 0;
  if (next) next.disabled = current === totalSlides - 1;
  if (counter) counter.textContent = (current + 1) + ' / ' + totalSlides;
 }

 return { showSlide, navNext, navPrev, syncFromShow, updateSlideNav, totalSlides };
}
