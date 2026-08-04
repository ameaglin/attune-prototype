const facilitatorNote = {
	title: "Facilitator Note: Before you begin",
	body: `
		<p>Each part of this gathering gives you three options to lead it — use whichever fits you and your group:</p>
		<ul>
			<li><b>Key Points</b> — the essentials, so you can speak in your own words and style.</li>
			<li><b>Full Script</b> — a complete script you can read as-is, or use as a starting point to improvise from.</li>
			<li><b>Play</b> — a recorded audio version you can simply play.</li>
		</ul>
		<p>Mix and match across the gathering — whatever helps you feel most natural leading.</p>`
};

const sectionTemplates = {
	arrival: {
		name: "Arrival & Grounding",
		subs: [
			{
				title: "Welcome & Opening",
				readAloud: true,
				keyPoints: ["Welcome everyone as they arrive", "Name tonight's flow in one line", "Invite a moment of silence before starting"],
				script: `Welcome, everyone. <b>I'm so glad you're here tonight.</b> Let's take a second to arrive — set down whatever you carried in with you today. <i>[Pause]</i> Tonight we'll spend some time in breakouts sharing where we've each noticed God's presence this week, then come back together before we close.`
			},
			{
				title: "Grounding Exercise",
				readAloud: true,
				keyPoints: ["Settle the body — breath, posture, senses", "Invite noticing, no need to share", "Go slowly; leave space between prompts"],
				script: `Let's take a moment to settle in together. Close your eyes if that's comfortable, or simply soften your gaze. <i>[Pause]</i> Notice your breath — you don't need to change it, just notice it. <i>[Pause]</i> Notice the weight of your body in the chair. <b>There's nowhere else you need to be right now.</b> <i>[Pause]</i> When you're ready, gently open your eyes.`
			}
		]
	},
	breakouts: {
		name: "Breakouts",
		subs: [
			{
				title: "Breakout instructions and timing",
				readAloud: false,
				keyPoints: ["Groups of 3 (4–5 max if needed)", "~7 min per person total", "3–5 min sharing, remainder for listener response", "Facilitators assign or let groups form freely", "One volunteer reads guidance aloud before starting"],
				script: `Split into groups of three, or four to five if needed. Each person gets about seven minutes total — three to five minutes to share, with the remainder for listener response. <b>Facilitators can assign groups or let them form freely.</b> Before starting, ask one volunteer in each group to read the sharing and listening guidance aloud. <i>[Pause]</i>`
			},
			{
				title: "Guidance for sharing and listening",
				readAloud: true,
				keyPoints: ["Share to deepen your own discernment", "Listeners hold space, don't fix or advise", "Passing is always okay"],
				script: `Before you begin sharing, a quick word on how this works. The purpose of sharing is for you, the speaker, to voice, clarify, claim, and act on your own best sense of God's guidance — not for the listener to understand every detail.<br><br>If you're listening, your job is simple: be a loving, attentive presence. You don't need to fix anything, offer advice, or fully understand the situation. <i>[Pause]</i> And remember — you can always say "pass" if you'd rather not share today.`
			}
		]
	},
	debrief: {
		name: "Large Group Debrief",
		subs: [
			{
				title: "Reconvene & Synthesize",
				readAloud: true,
				keyPoints: ["Welcome the group back together", "Ask what themes emerged across breakouts", "Name one thread worth carrying forward"],
				script: `Welcome back, everyone. Before we close, let's name a few things out loud. <b>Without sharing anything private,</b> what themes came up in your breakout? <i>[Pause]</i> Is there a thread here that feels important for our whole group to carry forward this week?`
			}
		]
	},
	close: {
		name: "Close",
		subs: [
			{
				title: "Closing Blessing",
				readAloud: true,
				keyPoints: ["Thank the group for showing up", "Invite one word or takeaway in silence", "Close with a brief blessing"],
				script: `Thank you all for being here and for the honesty you brought tonight. <b>Before we go, let's each hold one word</b> from tonight in silence. <i>[Pause]</i> Go in peace this week — trust what you noticed, and be gentle with yourself as you live it out.`
			}
		]
	}
};

const sessionTimes = [
	{ arrival: [0, 15], breakouts: [15, 40], debrief: [40, 52], close: [52, 60] },
	{ arrival: [0, 15], breakouts: [15, 45], debrief: [45, 55], close: [55, 60] },
	{ arrival: [0, 10], breakouts: [10, 40], debrief: [40, 52], close: [52, 60] },
	{ arrival: [0, 15], breakouts: [15, 35], debrief: [35, 50], close: [50, 60] }
];

const sectionOrder = ['arrival', 'breakouts', 'debrief', 'close'];

const sessions = sessionTimes.map((times, i) => ({
	id: i + 1,
	title: `Session ${i + 1}`,
	sections: sectionOrder.map(key => ({
		id: key,
		name: sectionTemplates[key].name,
		start: times[key][0],
		end: times[key][1],
		subs: sectionTemplates[key].subs
	}))
}));

let currentSessionIdx = -1;
let currentPieceFlat = -1;
let liveSectionIdx = 0;
let liveElapsedSeconds = 0;
let liveTimerInterval = null;

function currentSession() { return sessions[currentSessionIdx]; }

function flattenPieces(session) {
	const flat = [];
	session.sections.forEach((sec, si) => sec.subs.forEach((sub, bi) => flat.push({ sec, sub, si, bi })));
	return flat;
}

function renderTabCard(sub, key) {
	return `
	<div class="tab-card" data-key="${key}">
		<div class="tab-card-title">${sub.title}</div>
		<div class="guide-mode compact">
			<button class="guide-mode-btn active" onclick="switchCardTab(this,'key')">Key Points</button>
			<button class="guide-mode-btn" onclick="switchCardTab(this,'script')">Full Script</button>
			<button class="guide-mode-btn" onclick="switchCardTab(this,'play')">Play</button>
		</div>
		<div class="tab-panel" data-mode="key">
			<ul class="key-points-list">${sub.keyPoints.map(k => `<li>${k}</li>`).join('')}</ul>
		</div>
		<div class="tab-panel" data-mode="script" style="display:none">
			${sub.readAloud ? '<span class="read-aloud-tag">Read aloud to the small group</span>' : ''}
			<div class="script-text">${sub.script}</div>
		</div>
		<div class="tab-panel" data-mode="play" style="display:none">
			<div class="guide-audio-box">
				<div class="guide-audio-bars">
					<div class="guide-audio-bar" style="height:12px;animation-delay:0s"></div>
					<div class="guide-audio-bar" style="height:22px;animation-delay:0.2s"></div>
					<div class="guide-audio-bar" style="height:16px;animation-delay:0.4s"></div>
					<div class="guide-audio-bar" style="height:28px;animation-delay:0.6s"></div>
					<div class="guide-audio-bar" style="height:18px;animation-delay:0.1s"></div>
				</div>
				<p>[ Tap to play audio: ${sub.title} ]</p>
			</div>
		</div>
	</div>`;
}

function switchCardTab(btn, mode) {
	const card = btn.closest('.tab-card');
	card.querySelectorAll('.guide-mode-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	card.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.dataset.mode === mode ? 'block' : 'none');
}

function renderSessionList() {
	const el = document.getElementById('session-list');
	if (!el) return;
	el.innerHTML = sessions.map((s, i) => `
		<div class="guide-item" onclick="openSession(${i})">
			<div class="guide-num">${s.id}</div>
			<div class="guide-text"><div class="title">${s.title}</div><div class="sub">Live Gathering · 60 min · ${s.sections.length} sections</div></div>
		</div>`).join('');
}

function goSessionList() {
	currentSessionIdx = -1;
	setAppNavActive('guide');
	if (typeof window.onTopSlide === 'function') window.onTopSlide(0);
	window.show('guide-sessions');
}

function openSession(idx) {
	currentSessionIdx = idx;
	const session = sessions[idx];
	document.getElementById('agenda-session-title').textContent = session.title;
	renderAgendaPieces(session);
	setAppNavActive('guide');
	if (typeof window.onTopSlide === 'function') window.onTopSlide(idx + 1);
	window.show('guide-agenda');
}

function renderAgendaPieces(session) {
	document.getElementById('agenda-pieces').innerHTML = session.sections.map((sec, si) => `
		<div class="section-group">
			<div class="section-group-title"><span>${sec.name}</span><span class="section-group-range">${sec.start}–${sec.end} min</span></div>
			${sec.subs.map((sub, bi) => `
				<div class="guide-item" onclick="openPiece(${si},${bi})">
					<div class="guide-num">${bi + 1}</div>
					<div class="guide-text"><div class="title">${sub.title}</div><div class="sub">${sub.readAloud ? 'Read aloud to the small group' : 'Facilitator instructions'}</div></div>
				</div>`).join('')}
		</div>`).join('');
}

function toggleFacNote() {
	document.getElementById('fac-note').classList.toggle('collapsed');
}

function openPiece(si, bi) {
	const session = currentSession();
	const flat = flattenPieces(session);
	currentPieceFlat = flat.findIndex(p => p.si === si && p.bi === bi);
	renderCurrentPiece();
	window.show('guide-detail');
}

function renderCurrentPiece() {
	const session = currentSession();
	const flat = flattenPieces(session);
	const piece = flat[currentPieceFlat];
	document.getElementById('guide-num').textContent = currentPieceFlat + 1;
	document.getElementById('guide-title').textContent = piece.sub.title;
	document.getElementById('guide-subtitle').textContent = `${piece.sec.name} · min ${piece.sec.start}–${piece.sec.end}`;
	document.getElementById('guide-detail-body').innerHTML = renderTabCard(piece.sub, `detail-${piece.si}-${piece.bi}`);
	document.querySelector('#guide-detail .guide-sec-btn.gray').disabled = currentPieceFlat === 0;
	document.querySelector('#guide-detail .guide-sec-btn.dark').textContent = currentPieceFlat === flat.length - 1 ? 'Done →' : 'Next →';
}

function detailNext() {
	const flat = flattenPieces(currentSession());
	if (currentPieceFlat < flat.length - 1) { currentPieceFlat++; renderCurrentPiece(); window.show('guide-detail'); }
	else goGuideAgenda();
}

function detailPrev() {
	if (currentPieceFlat > 0) { currentPieceFlat--; renderCurrentPiece(); window.show('guide-detail'); }
}

function goGuideAgenda() {
	setAppNavActive('guide');
	window.show('guide-agenda');
}

function startLiveGathering() {
	liveSectionIdx = 0;
	liveElapsedSeconds = 0;
	document.getElementById('live-session-label').textContent = `${currentSession().title} · Live Gathering`;
	renderLiveSection();
	updateLiveTimerDisplay();
	if (liveTimerInterval) clearInterval(liveTimerInterval);
	liveTimerInterval = setInterval(() => { liveElapsedSeconds++; updateLiveTimerDisplay(); }, 1000);
	window.show('guide-live');
}

function exitLiveGathering() {
	if (liveTimerInterval) { clearInterval(liveTimerInterval); liveTimerInterval = null; }
	goGuideAgenda();
}

function liveGoSection(idx) {
	liveSectionIdx = idx;
	renderLiveSection();
}

function liveNextSection() {
	if (liveSectionIdx < currentSession().sections.length - 1) { liveSectionIdx++; renderLiveSection(); }
}

function livePrevSection() {
	if (liveSectionIdx > 0) { liveSectionIdx--; renderLiveSection(); }
}

function renderLiveSection() {
	const session = currentSession();
	const bar = document.getElementById('live-progress-bar');
	const labels = document.getElementById('live-progress-labels');
	bar.innerHTML = session.sections.map((sec, i) => {
		const width = ((sec.end - sec.start) / 60 * 100).toFixed(2);
		const state = i < liveSectionIdx ? 'done' : i === liveSectionIdx ? 'current' : 'upcoming';
		return `<div class="live-seg ${state}" style="width:${width}%" onclick="liveGoSection(${i})"></div>`;
	}).join('');
	labels.innerHTML = session.sections.map((sec, i) => {
		const width = ((sec.end - sec.start) / 60 * 100).toFixed(2);
		const state = i < liveSectionIdx ? 'done' : i === liveSectionIdx ? 'current' : 'upcoming';
		return `<div class="live-seg-label ${state}" style="width:${width}%">${sec.start}-${sec.end}</div>`;
	}).join('');
	const sec = session.sections[liveSectionIdx];
	document.getElementById('live-current-name').textContent = sec.name;
	const countText = sec.subs.length > 1 ? ` · ${sec.subs.length} parts` : '';
	document.getElementById('live-current-meta').textContent = `min ${sec.start}-${sec.end}${countText}`;
	document.getElementById('live-cards').innerHTML = sec.subs.map((sub, bi) => renderTabCard(sub, `live-${liveSectionIdx}-${bi}`)).join('');
	document.querySelector('.live-nav .live-prev').disabled = liveSectionIdx === 0;
	document.querySelector('.live-nav .live-next').disabled = liveSectionIdx === session.sections.length - 1;
}

function updateLiveTimerDisplay() {
	const m = Math.floor(liveElapsedSeconds / 60);
	const s = liveElapsedSeconds % 60;
	document.getElementById('live-timer').textContent = `${m}:${s.toString().padStart(2, '0')} elapsed`;
}

function setAppNavActive(tab) {
	document.querySelectorAll('.app-nav-item').forEach(item => {
		item.classList.toggle('active', item.dataset.tab === tab);
	});
}

function initAppNav(defaultTab) {
	renderSessionList();
	setAppNavActive(defaultTab || 'guide');
	const noteTitle = document.getElementById('fac-note-title-text');
	const noteBody = document.getElementById('fac-note-body');
	if (noteTitle) noteTitle.textContent = facilitatorNote.title;
	if (noteBody) noteBody.innerHTML = facilitatorNote.body;
}
