/* ==========================================================================
   Attune Round 4 Prototype — shared.js
   Shared engines used by both paid-circle.html and free.html:
   tab nav, input triad, Exercise Experience, Patterns,
   Classroom, Session Prep, Facilitator Guide (Connect).
   No persistence — all state lives in memory for the life of the page.
   ========================================================================== */

function escapeHtml(str) {
	return String(str == null ? '' : str)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const GLYPH_PATHS = {
	home: '<path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"/>',
	exercise: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
	explore: '<rect x="5" y="5" width="5.5" height="5.5" rx="1"/><rect x="13.5" y="5" width="5.5" height="5.5" rx="1"/><rect x="5" y="13.5" width="5.5" height="5.5" rx="1"/><rect x="13.5" y="13.5" width="5.5" height="5.5" rx="1"/>',
	connect: '<circle cx="8.5" cy="7" r="2.6"/><path d="M4 19.5 c0-3 2-4.8 4.5-4.8 s4.5 1.8 4.5 4.8"/><circle cx="15.8" cy="8" r="2.3"/><path d="M12.2 19.5 c0-2.5 1.7-4.2 3.6-4.2 s3.6 1.7 3.6 4.2"/>',
	profile: '<circle cx="12" cy="8" r="3"/><path d="M5.5 20 C5.5 16.4 8.4 14 12 14 S18.5 16.4 18.5 20"/>',
	type: '<path d="M5 19 L8.2 17.8 L18.2 7.8 C18.8 7.2 18.8 6.3 18.2 5.7 L16.3 3.8 C15.7 3.2 14.8 3.2 14.2 3.8 L4.2 13.8 L3 17 Z"/><path d="M13.4 5.6 L16.4 8.6"/>',
	speak: '<rect x="9" y="4" width="6" height="10" rx="3"/><path d="M7 12 C7 15.3 9.2 18 12 18 S17 15.3 17 12"/><path d="M12 18 V21"/>',
	settings: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.2"/><path d="M12 2.2 V4.6 M12 19.4 V21.8 M2.2 12 H4.6 M19.4 12 H21.8 M5.1 5.1 L6.8 6.8 M17.2 17.2 L18.9 18.9 M18.9 5.1 L17.2 6.8 M6.8 17.2 L5.1 18.9"/>'
};

function glyphIcon(name) {
	return `<svg class="glyph-icon" viewBox="0 0 24 24" aria-hidden="true">${GLYPH_PATHS[name] || ''}</svg>`;
}

function decorateTabIcons() {
	const labels = { home: 'Home', exercise: 'Exercises', connect: 'Circle', profile: 'Profile' };
	document.querySelectorAll('.tab-item[data-tab]').forEach(item => {
		const tab = item.dataset.tab;
		item.innerHTML = `<span class="tab-glyph">${glyphIcon(tab)}</span><span>${labels[tab] || tab}</span>`;
	});
	document.querySelectorAll('.settings-btn').forEach(btn => {
		btn.innerHTML = glyphIcon('settings');
	});
}

/* -------------------------------------------------------------------------
   App state — each persona file sets App.tier + render callbacks, then
   calls App.init(). Nothing here persists across a page reload.
   ------------------------------------------------------------------------- */
const App = {
	tier: 'free', // 'circle' (paid + Circle) | 'free' (not paid, not Circle)
	firstName: 'Sam',
	currentTab: 'home',
	exercises: [],           // past Attunement Exercise records
	dgeDone: false,          // Circle: Discernment of Growth Edges completed this season
	dgeUnlocked: false,      // Circle Session 4 prep — DGE offered, not 3+ solo
	lastDgeDay: null,        // YYYY-MM-DD of last DGE; null = never
	exerciseSubtab: 'patterns', // 'patterns' | 'past'
	pastSearch: '',
	fabCoached: false,
	growthEdges: {
		edges: ['I rush to prove I am enough.', 'Waiting feels like failure.'],
		goSteps: ['Pause before I say yes.', 'Name one true sentence in the hard conversation.']
	},
	classroomWatched: new Set(), // shared watched-state, indices into CLASSROOM_CHUNKS
	prep: { classroom: false, exercise: false, reflect: false, homeDismissed: false },
	renderers: {}, // { home, exercise, explore, connect } -> fn()

	init() {
		decorateTabIcons();
		hideTabBar(); // stays hidden until finishOnboarding() -> goTab('home') reveals it
	}
};

/* Demo seeds for the Exercises tab states (query ?ex=empty|few|ready|after) */
const SEED_KRLS = [
	{ id: 1, date: 'Session prep \u00b7 12 days ago', situation: 'Feeling behind at work heading into a big deadline.',
		themes: 'Stop rushing the work. See the deadline as it is — not as a verdict on me.',
		heartPosture: 'Gentle — not pushing, not abandoning.',
		nextSteps: 'Ask for one extra day before I say yes to more.',
		matrix: [
			{ relation: 'Self', good: 'I can still notice when I start to rush.', broken: 'I treat the clock as a judge.' },
			{ relation: 'Other / group', who: 'My manager', good: 'They named the deadline clearly.', broken: 'I assume they need me to absorb it all.' },
			{ relation: 'Non-human', who: 'The deadline', good: 'It makes the work concrete.', broken: 'It crowds out any pause.' }
		],
		quotes: [
			{ theme: 'trust', text: "I noticed my instinct was to rush \u2014 something shifted when I stopped.", date: 'Aug 5', day: '2026-08-05' },
			{ theme: 'clarity', text: "Stepping back, the situation looked different than I expected.", date: 'Aug 5', day: '2026-08-05' }
		] },
	{ id: 2, date: '6 days ago', situation: 'Some tension with a close friend I hadn\u2019t named out loud yet.',
		themes: 'Stay with the discomfort instead of smoothing it over.',
		heartPosture: 'Patient — willing to wait without fixing.',
		nextSteps: 'Name one true sentence the next time we talk. Don\'t solve it in the same breath.',
		matrix: [
			{ relation: 'Self', good: 'I stayed with it longer than I usually do.', broken: 'I still want to make it tidy.' },
			{ relation: 'Other / group', who: 'A close friend', good: 'They\'ve been honest when I\'ve asked.', broken: 'We both skip the hard beat.' },
			{ relation: 'Non-human', who: 'The unsaid thing between us', good: 'It\'s specific enough to name.', broken: 'It fills the silence.' }
		],
		quotes: [
			{ theme: 'patience', text: "Waiting felt uncomfortable, but I stayed with it longer than I usually do.", date: 'Aug 11', day: '2026-08-11' },
			{ theme: 'trust', text: "Letting go of needing to fix it right away felt like a small risk worth taking.", date: 'Aug 11', day: '2026-08-11' }
		] },
	{ id: 3, date: 'Session prep \u00b7 3 days ago', situation: 'Evenings at home feel like a scramble — kids, dishes, and no leftover attention.',
		themes: 'Presence is the offering, not a perfect evening.',
		heartPosture: 'Kind — not disappointed that I am tired.',
		nextSteps: 'Protect twenty minutes after they are in bed before I pick the phone up.',
		matrix: [
			{ relation: 'Self', good: 'I can still laugh with them in the noise.', broken: 'I count the minutes until it is over.' },
			{ relation: 'Other / group', who: 'My kids', good: 'They still come find me.', broken: 'I answer from another room.' },
			{ relation: 'Non-human', who: 'The evening clock', good: 'It names a real end to the day.', broken: 'It becomes a race I always lose.' }
		],
		quotes: [
			{ theme: 'patience', text: "The scramble is real — staying in the room felt like the smaller, truer thing.", date: 'Aug 14', day: '2026-08-14' },
			{ theme: 'trust', text: "I do not have to redeem the whole evening in one hour.", date: 'Aug 14', day: '2026-08-14' }
		] },
	{ id: 4, date: 'Yesterday', situation: 'A committee decision I am tempted to force so we can be done.',
		themes: 'Do not manufacture certainty. Let the group arrive.',
		heartPosture: 'Unhurried — willing to leave it open another week.',
		nextSteps: 'Ask one more question in the next meeting before I offer a plan.',
		matrix: [
			{ relation: 'Self', good: 'I can feel when I am pushing for closure.', broken: 'I treat undecided as unsafe.' },
			{ relation: 'Other / group', who: 'The committee', good: 'Someone named the real disagreement.', broken: 'We paper over it to stay on time.' },
			{ relation: 'Non-human', who: 'The vote', good: 'It will eventually make a shape.', broken: 'It crowds out listening.' }
		],
		quotes: [
			{ theme: 'clarity', text: "Forcing a vote would have been relief, not discernment.", date: 'Aug 16', day: '2026-08-16' },
			{ theme: 'trust', text: "Leaving it open another week felt like the risk.", date: 'Aug 16', day: '2026-08-16' }
		] }
];

function applyExerciseDemoFromQuery() {
	const params = new URLSearchParams(location.search);
	const ex = params.get('ex');
	App.dgeUnlocked = false;
	App.fabCoached = true;
	if (ex === 'empty') {
		App.exercises = []; App.dgeDone = false; App.lastDgeDay = null; App.dgeUnlocked = false; App.fabCoached = false;
	} else if (ex === 'few') {
		App.exercises = SEED_KRLS.slice(0, 2); App.dgeDone = false; App.lastDgeDay = null;
	} else if (ex === 'ready') {
		App.exercises = SEED_KRLS.slice(0, 4); App.dgeDone = false; App.lastDgeDay = null;
	} else if (ex === 's4') {
		App.exercises = SEED_KRLS.slice(0, 4); App.dgeDone = false; App.lastDgeDay = null; App.dgeUnlocked = true;
	} else if (ex === 'after') {
		App.exercises = SEED_KRLS.slice(0, 4); App.dgeDone = true; App.lastDgeDay = '2026-08-10'; App.dgeUnlocked = true;
	}
	const mark = ex || (App.dgeDone ? 'after' : App.dgeUnlocked ? 's4' : App.exercises.length >= 3 ? 'ready' : App.exercises.length ? 'few' : 'empty');
	document.querySelectorAll('[data-ex]').forEach(a => {
		a.classList.toggle('active', a.dataset.ex === mark);
	});
}

/* -------------------------------------------------------------------------
   Generic screen + tab-bar plumbing (shared screen/active convention)
   ------------------------------------------------------------------------- */
function showScreen(id) {
	document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
	const el = document.getElementById(id);
	if (el) el.classList.add('active');
}

let _obPath = 'circle';
function selectObPath(which) {
	_obPath = which;
	document.querySelectorAll('.path-option').forEach(el => {
		el.classList.toggle('selected', el.dataset.path === which);
	});
}
function continueObPath() {
	if (_obPath === 'circle') showScreen('ob-circle-join');
	else if (_obPath === 'explore') showScreen('ob-explore-circle');
	else if (typeof onPersonalPractice === 'function') onPersonalPractice();
}

function setTabActive(tab) {
	document.querySelectorAll('.tab-item').forEach(item => {
		item.classList.toggle('active', item.dataset.tab === tab);
	});
}

function hideTabBar() {
	const bar = document.querySelector('.tab-bar');
	if (bar) bar.style.display = 'none';
	closeExerciseFab();
	const fab = document.getElementById('ex-fab');
	if (fab) fab.classList.remove('visible');
}
function showTabBar() {
	const bar = document.querySelector('.tab-bar');
	if (bar) bar.style.display = '';
	syncExerciseFab();
}

function goTab(tab) {
	App.currentTab = tab;
	if (tab === 'profile') {
		openSettings();
		setTabActive('profile');
		showTabBar();
		return;
	}
	showScreen(tab);
	setTabActive(tab);
	showTabBar();
	if (App.renderers[tab]) App.renderers[tab]();
	syncExerciseFab();
	if (tab === 'exercise') maybeCoachFab();
}

/* -------------------------------------------------------------------------
   Type / Speak (voice-to-text) input — used by exercise steps + Reflect
   ------------------------------------------------------------------------- */
const TRIAD_TRANSCRIPTS = [
	"I notice there's more space here than I expected — it feels less urgent than it did a moment ago.",
	"Saying it out loud, I can hear how much I've been carrying this alone.",
	"There's a small resistance here, but underneath it, something softer.",
	"I keep coming back to the same word — steady. I think that's what I need right now."
];
let _triadTranscriptCursor = 0;

function renderInputTriadHTML(rootId) {
	return `
	<div class="input-triad" id="${rootId}">
		<div class="triad-buttons">
			<button type="button" class="triad-btn" data-mode="type" onclick="triadSetMode(this,'type')">
				${glyphIcon('type')}<span class="triad-btn-label">Type</span>
			</button>
			<button type="button" class="triad-btn" data-mode="speak" onclick="triadSetMode(this,'speak')">
				${glyphIcon('speak')}<span class="triad-btn-label">Speak</span>
			</button>
		</div>
		<div class="triad-body"></div>
	</div>`;
}

function triadSetMode(btn, mode) {
	const root = btn.closest('.input-triad');
	root.querySelectorAll('.triad-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	const body = root.querySelector('.triad-body');
	if (mode === 'type') {
		body.innerHTML = `<div class="triad-panel"><textarea class="triad-textarea" placeholder="Type your response…"></textarea></div>`;
	} else {
		const transcript = TRIAD_TRANSCRIPTS[_triadTranscriptCursor % TRIAD_TRANSCRIPTS.length];
		_triadTranscriptCursor++;
		body.innerHTML = `
		<div class="triad-panel">
			<div class="triad-voice-status"><span class="triad-rec-dot"></span><span class="caption" style="color:var(--ink);font-weight:600;">Listening — converting to text</span></div>
			<div class="triad-waveform">${Array.from({ length: 7 }).map((_, i) => `<span class="triad-wave-bar" style="height:${10 + (i * 5) % 26}px;animation-delay:${(i * 0.1).toFixed(1)}s"></span>`).join('')}</div>
			<div class="triad-transcript">${transcript}</div>
		</div>`;
	}
}

function triadGetValue(rootId) {
	const root = document.getElementById(rootId);
	if (!root) return '';
	const active = root.querySelector('.triad-btn.active');
	if (!active) return '';
	const mode = active.dataset.mode;
	if (mode === 'type') {
		const ta = root.querySelector('.triad-textarea');
		return ta ? ta.value.trim() : '';
	}
	const t = root.querySelector('.triad-transcript');
	return t ? t.textContent.trim() : '';
}

/* ==========================================================================
   EXERCISE ENGINE — shared full Attunement Exercise experience
   ========================================================================== */
const EXERCISE_STEPS = [
	{ label: 'Name Your Current Situation', prompt: "What's the situation you want to bring into this exercise?", hint: "Pick something real and current — big or small. There's no wrong choice." },
	{ label: 'Self: Good Patterns', prompt: "In this situation, what's a pattern in you that's serving you well?", hint: "Notice what's already working, even if just a little." },
	{ label: 'Self: Broken Patterns', prompt: "What's a pattern in you that isn't serving you well here?", hint: "No judgment — just notice what's not working yet." },
	{ label: 'Choose Other Person / Group', prompt: "Who else is part of this situation — a person or a group?", hint: "A specific person or group is easiest to work with." },
	{ label: 'Other Person: Good Patterns', prompt: "What's something they're doing well in this?", hint: "What do you appreciate about how they're showing up?" },
	{ label: 'Other Person: Bad Patterns', prompt: "What's a pattern in them that's getting in the way?", hint: "What gets in the way when you're together?" },
	{ label: 'Choose Non-Human Element', prompt: "Is there a non-human element at play — a circumstance, a deadline, a system?", hint: "Think circumstances, deadlines, places, or systems — not people." },
	{ label: 'Non-Human: Good Patterns', prompt: "What about that element is working in your favor?", hint: "What's working in your favor here?" },
	{ label: 'Non-Human: Broken Patterns', prompt: "What about it is working against you?", hint: "What's working against you here?" },
	{ label: "What's Resonating", prompt: "What words, phrases, or images are resonating with you as something God may want you to pay attention to?", hint: "There's no wrong answer — just notice what surfaces." }
];

const PATTERN_META = {
	trust: { label: 'Trust & Surrender', icon: '&#9680;' },
	patience: { label: 'Patience', icon: '&#8998;' },
	clarity: { label: 'Clarity', icon: '&#9678;' }
};
const PATTERN_ORDER = ['trust', 'patience', 'clarity'];

const ex = { mode: 'training', introAudio: false, warmupAudio: true, warmupWords: true, warmupPlaying: false, stepIdx: 0, responses: [], recap: null, returnTab: 'exercise', fromPrep: false, rating: 0 };

function startExercise(opts) {
	ex.mode = 'training';
	ex.introAudio = false;
	ex.warmupAudio = true;
	ex.warmupWords = true;
	ex.warmupPlaying = false;
	ex.stepIdx = 0;
	ex.responses = [];
	ex.recap = null;
	ex.rating = 0;
	ex.returnTab = (opts && opts.returnTab) || App.currentTab || 'exercise';
	ex.fromPrep = !!(opts && opts.fromPrep);
	hideTabBar();
	showScreen('exercise-overlay');
	renderExercisePrivacy();
}

function exOverlay(html) {
	document.getElementById('exercise-overlay-body').innerHTML = html;
}

function renderExercisePrivacy() {
	clearSitTimers();
	setSitImmersive(false);
	const listening = ex.introAudio;
	exOverlay(`
		<div class="h1" style="margin-bottom:6px;">A personal exercise</div>
		<p class="caption" style="margin-bottom:16px;">One real situation &middot; about 15&ndash;20 minutes</p>
		<button type="button" class="btn btn-light" style="margin-bottom:16px;" onclick="toggleIntroAudio()">${listening ? 'Playing intro' : 'Listen to intro'}</button>
		${listening ? `<div class="card static" style="text-align:center;padding:20px;margin-bottom:16px;">
			<div class="triad-waveform" style="justify-content:center;">${Array.from({ length: 7 }).map((_, i) => `<span class="triad-wave-bar" style="height:${12 + (i * 4) % 22}px;animation-delay:${(i * 0.1).toFixed(1)}s"></span>`).join('')}</div>
			<p class="caption">[ Playing intro &middot; ~1 min ]</p>
		</div>` : ''}
		<p class="body-text" style="margin-bottom:12px;">You&rsquo;ll bring one current situation and walk it through Listen, Discern, and Go. Notice what&rsquo;s serving you and what isn&rsquo;t &mdash; in yourself, in another person or group, and in any circumstance or system in the mix. Then name what you&rsquo;re sensing God invite, and a next step.</p>
		<p class="body-text" style="margin-bottom:12px;">Give each prompt the full time. Let it come to you rather than pushing through. You can always continue when you&rsquo;re ready.</p>
		<p class="caption" style="margin-bottom:8px;">What you write stays private. It is not shared with a facilitator or your Circle unless you choose.</p>
		<p class="caption" style="margin-bottom:20px;"><a href="javascript:void(0)" onclick="showAIInfo('exercise-overlay', renderExercisePrivacy)" style="color:inherit;text-decoration:underline;">How is AI used?</a></p>
		<button class="btn btn-dark btn-block-mt" onclick="renderExerciseWarmup()">Continue</button>
		<button class="btn-ghost" style="margin-top:14px;align-self:center;" onclick="renderExerciseWarmup()">Don&rsquo;t show me this again</button>`);
}

function toggleIntroAudio() {
	ex.introAudio = !ex.introAudio;
	renderExercisePrivacy();
}

const SIT_ORB_MS = 12000;
const WARMUP_MS = 24000;
const THINK_MS = 60000;
let _sitTimer = null;
let _sitRaf = null;
let _breathTimer = null;
let _sitDone = false;

function sitRingCircumference() { return 2 * Math.PI * 18; }

function sitSkipButtonHTML(onclick) {
	const c = sitRingCircumference();
	return `
		<button type="button" class="think-next" onclick="${onclick}" aria-label="Continue when ready">
			<svg class="think-ring" viewBox="0 0 40 40">
				<circle class="think-ring-track" cx="20" cy="20" r="18"/>
				<circle class="think-ring-fill" id="think-ring-fill" cx="20" cy="20" r="18"
					stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${c.toFixed(2)}"/>
			</svg>
			<span class="think-next-inner">&rsaquo;</span>
		</button>`;
}

function sitStageInnerHTML(opts) {
	const kicker = opts.kicker ? `<div class="think-kicker">${opts.kicker}</div>` : '';
	const title = opts.title ? `<p class="think-prompt">${opts.title}</p>` : '';
	const extra = opts.extra || '';
	return `
		<div class="sit-fade" id="sit-fade"></div>
		<div class="sit-stage-inner">
			${kicker}
			<div class="sit-orb" aria-hidden="true"></div>
			${title}
			<div class="think-foot">
				<div class="think-breathe" id="think-breathe">Breathe in</div>
				${opts.showSkip ? sitSkipButtonHTML(opts.skipOnclick) : ''}
			</div>
			${extra}
		</div>`;
}

function setSitImmersive(on) {
	const el = document.getElementById('exercise-overlay');
	if (!el) return;
	el.classList.toggle('sit-immersive', !!on);
	if (!on) el.classList.remove('sit-light');
}

function breathCueAt(elapsed) {
	const t = elapsed % SIT_ORB_MS;
	if (t < 4560) return 'Breathe in';
	if (t < 6000) return 'Hold';
	if (t < 10560) return 'Breathe out';
	return 'Breathe in';
}

function clearSitTimers() {
	if (_sitTimer) { clearTimeout(_sitTimer); _sitTimer = null; }
	if (_sitRaf) { cancelAnimationFrame(_sitRaf); _sitRaf = null; }
	if (_breathTimer) { clearInterval(_breathTimer); _breathTimer = null; }
}

function markSitReady() {
	_sitDone = true;
	const fade = document.getElementById('sit-fade');
	if (fade) fade.style.opacity = '1';
	const fill = document.getElementById('think-ring-fill');
	if (fill) fill.style.strokeDashoffset = '0';
	const b = document.getElementById('think-breathe');
	if (b) b.textContent = 'Whenever you\u2019re ready';
	const stage = document.querySelector('.sit-stage');
	if (stage) stage.classList.add('is-light');
	const overlay = document.getElementById('exercise-overlay');
	if (overlay && overlay.classList.contains('sit-immersive')) overlay.classList.add('sit-light');
}

function startSitTimer(durationMs) {
	clearSitTimers();
	_sitDone = false;
	const c = sitRingCircumference();
	const fill = document.getElementById('think-ring-fill');
	const fade = document.getElementById('sit-fade');
	const started = Date.now();
	function tick() {
		if (_sitDone) return;
		const p = Math.min(1, (Date.now() - started) / durationMs);
		if (fill) fill.style.strokeDashoffset = String(c * (1 - p));
		if (fade) fade.style.opacity = String(p);
		const stage = document.querySelector('.sit-stage');
		if (stage && p >= 0.45) stage.classList.add('is-light');
		const overlay = document.getElementById('exercise-overlay');
		if (overlay && overlay.classList.contains('sit-immersive') && p >= 0.45) overlay.classList.add('sit-light');
		if (p >= 1) { clearSitTimers(); markSitReady(); return; }
		_sitRaf = requestAnimationFrame(tick);
	}
	_breathTimer = setInterval(() => {
		if (_sitDone) return;
		const b = document.getElementById('think-breathe');
		if (b) b.textContent = breathCueAt(Date.now() - started);
	}, 200);
	_sitTimer = setTimeout(() => { clearSitTimers(); markSitReady(); }, durationMs);
	tick();
}

function skipSit() {
	clearSitTimers();
	markSitReady();
}

const WARMUP_WORDS = 'Take a moment to settle. Notice your breath, the weight of your body, the sounds around you. There\'s nothing to solve right now — just arrive, and let your attention soften before the exercise begins.';

function warmupAudioHTML() {
	return `<div class="sit-listen"><div class="triad-waveform">${Array.from({ length: 7 }).map((_, i) => `<span class="triad-wave-bar" style="height:${12 + (i * 4) % 22}px;animation-delay:${(i * 0.1).toFixed(1)}s"></span>`).join('')}</div><p class="caption">[ Playing warm-up audio &middot; 3&ndash;4 min ]</p></div>`;
}

function paintWarmupSlots() {
	const audioSlot = document.getElementById('warmup-audio-slot');
	const wordsSlot = document.getElementById('warmup-words-slot');
	if (audioSlot) audioSlot.innerHTML = (ex.warmupPlaying && ex.warmupAudio) ? warmupAudioHTML() : '';
	if (wordsSlot) wordsSlot.innerHTML = (ex.warmupPlaying && ex.warmupWords) ? `<p class="body-text sit-words">${WARMUP_WORDS}</p>` : '';
}

function paintWarmupToggles() {
	document.querySelectorAll('[data-warmup-toggle]').forEach(btn => {
		const on = btn.dataset.warmupToggle === 'audio' ? ex.warmupAudio : ex.warmupWords;
		btn.classList.toggle('active', on);
	});
}

function toggleWarmupFlag(which) {
	if (which === 'audio') ex.warmupAudio = !ex.warmupAudio;
	else ex.warmupWords = !ex.warmupWords;
	paintWarmupToggles();
	paintWarmupSlots();
}

function startWarmupPlay() {
	ex.warmupPlaying = true;
	renderExerciseWarmup();
}

function renderExerciseWarmup() {
	const playing = !!ex.warmupPlaying;
	if (!playing) clearSitTimers();
	setSitImmersive(false);
	const extra = playing
		? `<div id="warmup-audio-slot"></div><div id="warmup-words-slot"></div>`
		: `<button type="button" class="sit-play" onclick="startWarmupPlay()" aria-label="Start warm-up"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg></button>`;
	exOverlay(`
		<div class="warmup-page">
			<button class="btn-ghost back-link" onclick="renderExercisePrivacy()">&larr; Back</button>
			<div class="h1" style="margin-bottom:6px;">Warm-up</div>
			<p class="caption">A short warm-up before your personal exercise. Just listen or read — no need to respond.</p>
			<div class="warmup-toggles">
				<button type="button" class="warmup-toggle${ex.warmupAudio ? ' active' : ''}" data-warmup-toggle="audio" onclick="toggleWarmupFlag('audio')">Audio</button>
				<button type="button" class="warmup-toggle${ex.warmupWords ? ' active' : ''}" data-warmup-toggle="words" onclick="toggleWarmupFlag('words')">Words</button>
			</div>
			<div class="sit-stage sit-stage--full${playing ? '' : ' is-idle'}">
				${sitStageInnerHTML({
					kicker: 'Warm-up',
					showSkip: playing,
					skipOnclick: 'skipSit()',
					extra
				})}
			</div>
			${playing ? `<div class="sit-actions"><button class="btn btn-dark" onclick="renderExerciseStep(0)">I&rsquo;m ready</button></div>` : ''}
		</div>`);
	if (playing) {
		paintWarmupSlots();
		startSitTimer(WARMUP_MS);
	}
}

function setWarmupMode(id) {
	ex.warmupAudio = id === 'audio' || id === 'both';
	ex.warmupWords = id === 'words' || id === 'both';
	paintWarmupToggles();
	paintWarmupSlots();
}

function exerciseMovement(idx) {
	if (idx === 0) return 'Name';
	if (idx === EXERCISE_STEPS.length - 1) return 'Discern';
	return 'Listen';
}

function renderExerciseStep(idx) {
	clearSitTimers();
	setSitImmersive(false);
	ex.stepIdx = idx;
	const step = EXERCISE_STEPS[idx];
	const isLast = idx === EXERCISE_STEPS.length - 1;
	exOverlay(`
		<div class="exercise-topbar">
			<button class="btn-ghost" onclick="${idx === 0 ? "renderExerciseWarmup()" : `renderExerciseStep(${idx - 1})`}" aria-label="Back">&#10005;</button>
			<span class="exercise-step-count">${exerciseMovement(idx)} · ${idx + 1} of ${EXERCISE_STEPS.length}</span>
			<button class="btn-ghost" onclick="cancelExercise()">Save</button>
		</div>
		<div class="pace-track" aria-hidden="true"><div class="pace-fill" style="width:${((idx + 1) / EXERCISE_STEPS.length) * 100}%"></div></div>
		<div class="seg-toggle" style="margin-top:2px;">
			<button class="seg-toggle-btn${ex.mode === 'training' ? ' active' : ''}" onclick="setExerciseMode(this,'training')">Training</button>
			<button class="seg-toggle-btn${ex.mode === 'practice' ? ' active' : ''}" onclick="setExerciseMode(this,'practice')">Practice</button>
		</div>
		<div id="ex-guidance-card" style="display:${ex.mode === 'training' ? 'block' : 'none'}">
			<div class="guidance-card"><p class="caption" style="color:var(--body);">${escapeHtml(step.hint)}</p></div>
		</div>
		<div class="think-panel sit-stage sit-stage--panel">
			${sitStageInnerHTML({
				kicker: 'Sit with this',
				title: escapeHtml(step.prompt),
				showSkip: true,
				skipOnclick: 'skipSit()'
			})}
		</div>
		${renderInputTriadHTML('triad-current')}
		<button class="btn btn-dark btn-block-mt" onclick="exerciseNext(${idx}, ${isLast})">${isLast ? 'Continue to Recap &rarr;' : 'Next &rarr;'}</button>
		<div style="height:16px"></div>`);
	startSitTimer(THINK_MS);
}

function setExerciseMode(btn, mode) {
	ex.mode = mode;
	document.querySelectorAll('.exercise-overlay .seg-toggle-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	const card = document.getElementById('ex-guidance-card');
	if (card) card.style.display = mode === 'training' ? 'block' : 'none';
}

function exerciseNext(idx, isLast) {
	ex.responses[idx] = triadGetValue('triad-current');
	if (isLast) renderExerciseOutput();
	else renderExerciseStep(idx + 1);
}

function deriveTheme(stepIdx) { return PATTERN_ORDER[stepIdx % PATTERN_ORDER.length]; }

function recapFromLive() {
	const r = (i) => (ex.responses[i] && ex.responses[i].length) ? ex.responses[i] : '(not captured)';
	return {
		situation: r(0),
		themes: r(9),
		heartPosture: '(Named in Discern — not in this Listen pass yet.)',
		nextSteps: '(Named in Go — not in this Listen pass yet.)',
		matrix: [
			{ relation: 'Self', good: r(1), broken: r(2) },
			{ relation: 'Other / group', who: r(3), good: r(4), broken: r(5) },
			{ relation: 'Non-human', who: r(6), good: r(7), broken: r(8) }
		]
	};
}

function recapFromRecord(rec) {
	if (rec.heartPosture || rec.nextSteps || rec.matrix) {
		return {
			situation: rec.situation || '(no situation captured)',
			themes: rec.themes || (rec.quotes || []).map(q => q.text).join(' '),
			heartPosture: rec.heartPosture || '(Named in Discern — not captured.)',
			nextSteps: rec.nextSteps || '(Named in Go — not captured.)',
			matrix: rec.matrix || []
		};
	}
	if (rec.responses && rec.responses.length) {
		const saved = ex.responses;
		ex.responses = rec.responses;
		const data = recapFromLive();
		ex.responses = saved;
		data.situation = rec.situation || data.situation;
		return data;
	}
	return {
		situation: rec.situation || '(no situation captured)',
		themes: (rec.quotes || []).map(q => q.text).join(' '),
		heartPosture: '(Named in Discern — not captured.)',
		nextSteps: '(Named in Go — not captured.)',
		matrix: []
	};
}

function recapField(label, body, kind, opts) {
	const text = String(body || '');
	const empty = !text.trim() || text.charAt(0) === '(';
	const edit = !!(opts && opts.edit);
	const cls = ['recap-field', kind === 'lead' ? 'recap-field-lead' : '', kind === 'quote' ? 'recap-field-quote' : '', !edit && empty ? 'is-empty' : ''].filter(Boolean).join(' ');
	if (edit) {
		return `
		<div class="${cls}">
			<div class="recap-field-label">${escapeHtml(label)}</div>
			<textarea class="recap-edit" data-recap="${escapeHtml(opts.name)}" rows="4">${escapeHtml(text)}</textarea>
		</div>`;
	}
	return `
		<div class="${cls}">
			<div class="recap-field-label">${escapeHtml(label)}</div>
			<div class="recap-field-body">${escapeHtml(text)}</div>
		</div>`;
}

function recapChromeHTML(edit) {
	return `
		<div class="recap-hero">
			<div class="kicker">Personal exercise</div>
			<div class="h1">Your recap</div>
			<p class="caption">${edit
				? 'This is a first pass. Edit anything that missed the nuance \u2014 we want this in your words.'
				: 'What you discerned \u2014 this is what you\u2019d reopen, and may take to the gathering.'}</p>
		</div>`;
}

function recapCardsHTML(data, aiOnclick, edit) {
	const matrix = (data.matrix || []).map(row => `
		<div class="recap-matrix-item">
			<div class="recap-field-label">${escapeHtml(row.relation)}${row.who ? ' \u00b7 ' + escapeHtml(row.who) : ''}</div>
			<div class="recap-pair">
				<div>
					<p class="recap-pair-label">Serving well</p>
					<p class="recap-pair-body">${escapeHtml(row.good)}</p>
				</div>
				<div>
					<p class="recap-pair-label">Not serving well</p>
					<p class="recap-pair-body">${escapeHtml(row.broken)}</p>
				</div>
			</div>
		</div>`).join('');
	return `
		<div class="recap-primary">
			${recapField('Situation', data.situation, 'lead', edit ? { edit: true, name: 'situation' } : null)}
			${recapField("Key themes of God's guidance", data.themes, 'quote', edit ? { edit: true, name: 'themes' } : null)}
			${recapField("God's heart posture", data.heartPosture, 'quote', edit ? { edit: true, name: 'heartPosture' } : null)}
			${recapField('Key next steps', data.nextSteps, null, edit ? { edit: true, name: 'nextSteps' } : null)}
		</div>
		${(data.matrix && data.matrix.length) ? `<div class="recap-listen">
			<div class="kicker">Listen</div>
			<p class="caption recap-listen-lede">The three relationships — good and broken. These sit under the themes, not above them.</p>
			${matrix}
		</div>` : ''}
		<p class="recap-ai"><a href="javascript:void(0)" onclick="${aiOnclick}">How is AI used?</a></p>`;
}

function renderExerciseOutput() {
	clearSitTimers();
	setSitImmersive(false);
	const data = recapFromLive();
	exOverlay(`
		${recapChromeHTML(true)}
		<div class="recap-scroll">
		${recapCardsHTML(data, "showAIInfo('exercise-overlay', renderExerciseOutput)", true)}
		</div>
		<button class="btn btn-dark btn-block-mt" onclick="confirmExerciseRecap()">Looks good</button>
		<div style="height:16px"></div>`);
}

function recapEditValue(name, fallback) {
	const el = document.querySelector('textarea[data-recap="' + name + '"]');
	return el ? el.value : fallback;
}

function confirmExerciseRecap() {
	const data = recapFromLive();
	ex.recap = {
		...data,
		situation: recapEditValue('situation', data.situation),
		themes: recapEditValue('themes', data.themes),
		heartPosture: recapEditValue('heartPosture', data.heartPosture),
		nextSteps: recapEditValue('nextSteps', data.nextSteps)
	};
	finishExercise();
}

function buildExerciseRecord() {
	const num = App.exercises.length + 1;
	const recap = ex.recap || recapFromLive();
	const situation = recap.situation || ((ex.responses[0] && ex.responses[0].length) ? ex.responses[0] : 'A situation from today\u2019s exercise');
	const quoteAt = [1, 9]; // Self: Good Patterns, What's Resonating
	const quotes = quoteAt.map(i => {
		const text = (ex.responses[i] && ex.responses[i].length) ? ex.responses[i] : TRIAD_TRANSCRIPTS[i % TRIAD_TRANSCRIPTS.length];
		return { theme: deriveTheme(i), text, date: 'Today', day: quoteDayKey({ date: 'Today' }) };
	});
	return {
		id: num,
		date: 'Today',
		situation,
		quotes,
		responses: ex.responses.slice(),
		themes: recap.themes,
		heartPosture: recap.heartPosture,
		nextSteps: recap.nextSteps,
		matrix: recap.matrix
	};
}

function cancelExercise() {
	clearSitTimers();
	setSitImmersive(false);
	showTabBar();
	if (ex.fromPrep) { showScreen('prep-overlay'); prepShowChecklist(); }
	else goTab(ex.returnTab);
}

function finishExercise() {
	const record = buildExerciseRecord();
	App.exercises.push(record);
	App.prep.exercise = true;
	showTabBar();
	if (ex.fromPrep) {
		showScreen('prep-overlay');
		prepShowChecklist();
	} else {
		goTab(ex.returnTab);
	}
}

/* ==========================================================================
   CLASSROOM — Session Prep learning (not on Home; session-specific stays in Circle prep)
   Same watched-state either way (App.classroomWatched)
   ========================================================================== */
const CLASSROOM_CHUNKS = [
	{ title: 'What Is Attunement?', duration: '2 min', desc: 'A short intro to what attunement means and why it matters for how you show up.', session1: true },
	{ title: 'The Three Postures', duration: '1.5 min', desc: 'Three postures — noticing, listening, responding — that shape every attunement exercise.', session1: true },
	{ title: 'Listening Without Fixing', duration: '2 min', desc: 'Why the goal in a Circle Community is presence, not problem-solving.', session1: true },
	{ title: 'Practicing Presence', duration: '1.5 min', desc: 'A short practice for settling into the room before a session begins.', session1: true }
];

const EXPLORE_TOPICS = [
	{
		title: 'Learning Attune',
		desc: 'Evergreen pieces on attunement, Circle Community, and how this app holds the whole process.',
		free: true,
		items: [
			{ kind: 'video', title: 'What Is Attunement?', duration: '2 min', desc: 'Noticing what is stirring in you — and learning to recognize God\'s voice within it. Attune helps facilitate discernment; it does not replace it.', art: 'b' },
			{ kind: 'reading', title: 'What Is a Circle Community?', desc: 'A small group that moves through a shared season of attunement together.', art: 'a' },
			{ kind: 'video', title: 'How the App Supports Circle Community', duration: '2 min', desc: 'Solo personal exercises, Explore, Session Prep, and Facilitator Mode — each piece helps you show up ready, then gather.', art: 'c' },
			{ kind: 'reading', title: 'The Whole Process', desc: 'Prepare on your own. Gather with your Circle Community. Notice patterns over time.', art: 'd' },
		]
	},
	{
		title: 'Living Unhurried',
		desc: 'On resisting the urge to rush your own discernment.',
		items: [
			{ kind: 'reading', title: 'Unhurried Path', desc: 'A photograph of an unhurried walk, with a few words to sit with.', art: 'c' },
			{ kind: 'video', title: 'Living Unhurried', duration: '2 min', desc: 'On resisting the urge to rush your own discernment.', art: 'a' },
			{ kind: 'video', title: 'Enough for Today', duration: '1.5 min', desc: 'Permission to stop when the hour is full.', art: 'b' },
			{ kind: 'reading', title: 'Evening Light', desc: 'A still frame at the end of the day.', art: 'd' }
		]
	},
	{
		title: "Naming What's True",
		desc: 'Language for what is actually happening, without spin.',
		items: [
			{ kind: 'video', title: "Naming What's True", duration: '1.5 min', desc: 'A short teaching on naming what is actually happening.', art: 'b' },
			{ kind: 'reading', title: 'Plain Words', desc: 'A card of simple, true language.', art: 'a' },
			{ kind: 'video', title: 'Without the Story', duration: '2 min', desc: 'Separate the facts from the narrative you added.', art: 'd' },
			{ kind: 'reading', title: 'Clear Horizon', desc: 'An image for seeing the situation as it is.', art: 'c' }
		]
	}
];

const LOREM_PAGES = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere sapien lorem viverra nisi, vitae dictum nisl nisl at nisl.',
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.',
	'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Pellentesque habitant morbi tristique senectus.'
];

function readingPages(item) {
	const arts = [item.art, 'a', 'b', 'c', 'd'];
	return LOREM_PAGES.map((text, i) => ({ art: arts[i % arts.length], text }));
}

let _classroomListEl = null, _classroomProgressEl = null, _classroomFilter = null, _classroomReturnScreen = 'home';

function renderClassroomList(listId, progressId, session1Only, returnScreenId) {
	_classroomListEl = listId;
	_classroomProgressEl = progressId;
	_classroomFilter = session1Only ? (i) => CLASSROOM_CHUNKS[i].session1 : null;
	const returnTo = returnScreenId || App.currentTab;
	const indices = CLASSROOM_CHUNKS.map((_, i) => i).filter(i => !_classroomFilter || _classroomFilter(i));
	const el = document.getElementById(listId);
	el.innerHTML = indices.map(i => {
		const c = CLASSROOM_CHUNKS[i];
		const watched = App.classroomWatched.has(i);
		return `
		<div class="classroom-item${watched ? ' watched' : ''}" onclick="openClassroomVideo(${i}, '${returnTo}', [${indices.join(',')}])">
			<div class="classroom-play">${watched ? '&#10003;' : '&#9654;'}</div>
			<div style="flex:1;">
				<b style="font-size:14px;display:block;">${escapeHtml(c.title)}${c.session1 ? ' <span class=\"tag outline\" style=\"margin-left:6px;vertical-align:middle;\">Session 1</span>' : ''}</b>
				<span class="classroom-sub">${watched ? 'Watched' : c.duration}</span>
			</div>
		</div>`;
	}).join('');
	if (progressId) {
		const watchedCount = indices.filter(i => App.classroomWatched.has(i)).length;
		document.getElementById(progressId).textContent = `${watchedCount} of ${indices.length} watched`;
	}
}

/* Home tab: free intro tiles. Session-specific learning stays in Circle prep.
   Free users also see locked teasers — not extra-session classroom. */
const HOME_INTRO = [
	{ id: 'attunement', title: 'What is attunement?', caption: 'Noticing what is stirring in you — and learning to recognize God\'s voice within it.', kind: 'video', duration: '2 min', art: 'b' },
	{ id: 'circle', title: 'What is a Circle?', caption: 'A small group that moves through a shared season of attunement together.', kind: 'reading', art: 'a' },
	{ id: 'data', title: 'What happens with my data?', caption: 'Your reflections stay private. Nothing is shared unless you choose to share it.', kind: 'reading', art: 'd' }
];
const HOME_LOCKED = [
	{ title: 'Living Unhurried', caption: 'On resisting the urge to rush your own discernment.', kind: 'video', duration: '2 min', art: 'c' },
	{ title: "Naming What's True", caption: 'Language for what is actually happening, without spin.', kind: 'reading', art: 'a' }
];
const HOME_DATA_ITEM = {
	kind: 'reading',
	title: 'What happens with my data?',
	desc: 'Your reflections stay private. Nothing is shared unless you choose to share it.',
	art: 'd'
};

function homeIntroCardHTML(item, locked) {
	const kindLabel = item.kind === 'video' ? 'Video' : 'Reading';
	const sub = locked
		? 'Included with a Circle'
		: (item.kind === 'video' ? `Video \u00b7 ${escapeHtml(item.duration)}` : 'Picture + Text');
	const artInner = item.kind === 'video'
		? '<span class="topic-play">&#9654;</span>'
		: `<p class="topic-blurb">${escapeHtml(item.caption)}</p>`;
	const lock = locked ? '<span class="topic-kind">Locked</span>' : `<span class="topic-kind">${kindLabel}</span>`;
	const click = locked ? 'unlockHomeTeaser()' : `openHomeIntro('${item.id}')`;
	return `
		<button type="button" class="topic-card${locked ? ' dim' : ''}" onclick="${click}">
			<div class="topic-card-art art-${item.art}">
				${lock}
				${artInner}
			</div>
			<div class="topic-card-title">${escapeHtml(item.title)}</div>
			<div class="topic-card-sub">${sub}</div>
		</button>`;
}

function renderHomeIntro() {
	const el = document.getElementById('home-intro-slot');
	if (!el) return;
	let html = `<div class="home-classes-heading"><b>Learn about Attune</b></div>
		<div class="topic-rail home-intro-rail">${HOME_INTRO.map(item => homeIntroCardHTML(item, false)).join('')}</div>`;
	if (App.tier === 'free') {
		html += `<div class="home-classes-heading home-intro-below"><b>With a Circle</b></div>
		<div class="topic-rail home-intro-rail">${HOME_LOCKED.map(item => homeIntroCardHTML(item, true)).join('')}</div>`;
	}
	el.innerHTML = html;
}

function openHomeIntro(id) {
	if (id === 'attunement') openExploreItem(0, 0, 'home');
	else if (id === 'circle') openExploreItem(0, 1, 'home');
	else if (id === 'data') openReading(HOME_DATA_ITEM, 'home');
}

function unlockHomeTeaser() {
	showStub('Included with a Circle', 'This learning sits with the Circle experience. Session-specific pieces stay in Circle prep so you meet them at the right time. This demo doesn\'t include a working purchase flow.', 'Back', function(){ goTab('home'); });
}

function openExploreItem(topicIdx, itemIdx, returnScreenId) {
	const topic = EXPLORE_TOPICS[topicIdx];
	const item = topic.items[itemIdx];
	const backTo = returnScreenId || 'home';
	if (item.kind === 'video') {
		const videos = topic.items.filter(it => it.kind === 'video');
		const start = Math.max(0, videos.indexOf(item));
		openMediaFeed(videos.map(v => ({
			title: v.title,
			duration: v.duration,
			desc: v.desc,
			badge: topic.title
		})), start, backTo);
		return;
	}
	openReading(item, backTo);
}

let _readingReturn = 'home';
function openReading(item, returnScreenId) {
	_readingReturn = returnScreenId || 'home';
	const pages = readingPages(item);
	const rail = document.getElementById('read-rail');
	document.getElementById('read-title').textContent = item.title;
	rail.innerHTML = pages.map((p, i) => `
		<div class="read-page">
			<div class="read-art art-${p.art}"></div>
			<div class="read-copy">
				<p class="body-text">${escapeHtml(p.text)}</p>
				<p class="caption">${i + 1} of ${pages.length}${i < pages.length - 1 ? ' \u00b7 Swipe for the Next' : ''}</p>
			</div>
		</div>`).join('');
	hideTabBar();
	showScreen('reading-overlay');
	rail.scrollLeft = 0;
}

function closeReading() {
	goTab(_readingReturn);
}

/* -------------------------------------------------------------------------
   Video feed — vertical swipe-through-videos overlay. Whatever list the
   user was browsing (all of Explore, or the Session-1 subset from Prep)
   becomes a scroll-snapped feed they can swipe/scroll up through, Shorts-
   style, instead of watching one video and backing out each time.
   ------------------------------------------------------------------------- */
let _videoList = [], _videoItems = null, _videoPos = 0, _videoObserver = null;

function openClassroomVideo(idx, returnScreenId, listIndices) {
	const indices = (listIndices && listIndices.length) ? listIndices : CLASSROOM_CHUNKS.map((_, i) => i);
	const items = indices.map(i => {
		const c = CLASSROOM_CHUNKS[i];
		return { key: 'c' + i, title: c.title, duration: c.duration, desc: c.desc, badge: c.session1 ? 'Session 1' : 'Learning' };
	});
	openMediaFeed(items, Math.max(0, indices.indexOf(idx)), returnScreenId || App.currentTab);
}

function openMediaFeed(items, startIdx, returnScreenId) {
	_videoItems = items;
	_videoList = items.map((_, i) => i);
	_videoPos = startIdx || 0;
	_classroomReturnScreen = returnScreenId || App.currentTab;
	hideTabBar();
	showScreen('video-overlay');
	renderVideoFeed();
	scrollVideoFeedTo(_videoPos, false);
	updateVideoNavState();
	markVideoWatched(_videoPos);
}

function renderVideoFeed() {
	const scrollEl = document.getElementById('vfeed-scroll');
	const items = _videoItems || [];
	scrollEl.innerHTML = items.map((c, pos) => {
		const watched = c.key && App.classroomWatched.has(Number(String(c.key).slice(1)));
		const isImage = c.kind === 'image' || c.duration === 'Image';
		return `
		<div class="vfeed-slide" data-ci="${pos}" data-pos="${pos}">
			<div class="vfeed-play">${isImage ? '[ Image ]' : '[ Video Playing &middot; ' + escapeHtml(c.duration) + ' ]'}</div>
			<div class="vfeed-info">
				<span class="vfeed-badge${watched ? ' watched' : ''}" id="vfeed-badge-${pos}">${watched ? '&#10003; Watched' : escapeHtml(c.badge || '')}</span>
				<h3>${escapeHtml(c.title)}</h3>
				<p>${escapeHtml(c.desc)}</p>
			</div>
		</div>`;
	}).join('');

	if (_videoObserver) _videoObserver.disconnect();
	_videoObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
				_videoPos = Number(entry.target.dataset.pos);
				markVideoWatched(_videoPos);
				updateVideoNavState();
			}
		});
	}, { root: scrollEl, threshold: [0.6] });
	scrollEl.querySelectorAll('.vfeed-slide').forEach(s => _videoObserver.observe(s));
}

function markVideoWatched(pos) {
	const item = _videoItems && _videoItems[pos];
	if (!item || !item.key || item.key[0] !== 'c') return;
	const ci = Number(item.key.slice(1));
	if (App.classroomWatched.has(ci)) return;
	App.classroomWatched.add(ci);
	const badge = document.getElementById(`vfeed-badge-${pos}`);
	if (badge) { badge.classList.add('watched'); badge.innerHTML = '&#10003; Watched'; }
	checkPrepClassroomComplete();
}

function updateVideoNavState() {
	const prevBtn = document.getElementById('vfeed-prev-btn');
	const nextBtn = document.getElementById('vfeed-next-btn');
	const hint = document.getElementById('vfeed-hint');
	if (prevBtn) prevBtn.disabled = _videoPos <= 0;
	if (nextBtn) nextBtn.disabled = _videoPos >= _videoList.length - 1;
	if (hint) hint.style.opacity = (_videoList.length > 1 && _videoPos < _videoList.length - 1) ? '1' : '0';
}

function scrollVideoFeedTo(pos, smooth) {
	const scrollEl = document.getElementById('vfeed-scroll');
	const target = scrollEl.querySelector(`.vfeed-slide[data-pos="${pos}"]`);
	if (target) target.scrollIntoView({ behavior: smooth === false ? 'auto' : 'smooth', block: 'start' });
}

function nextVideoSlide() { if (_videoPos < _videoList.length - 1) scrollVideoFeedTo(_videoPos + 1); }
function prevVideoSlide() { if (_videoPos > 0) scrollVideoFeedTo(_videoPos - 1); }

function closeClassroomVideo() {
	if (_videoObserver) { _videoObserver.disconnect(); _videoObserver = null; }
	if (_classroomListEl) renderClassroomList(_classroomListEl, _classroomProgressEl, !!_classroomFilter);
	if (_classroomReturnScreen === 'prep-overlay') {
		showScreen('prep-overlay');
		showTabBar();
	} else {
		goTab(_classroomReturnScreen || App.currentTab);
	}
}

/* ==========================================================================
   PATTERNS — themed cards, engagement + tier gating, Discernment stub
   ========================================================================== */
function getAllQuotes() {
	return App.exercises.flatMap(e => e.quotes.map(q => Object.assign({}, q, { exId: e.id })));
}

function quoteDayKey(q) {
	if (q.day) return q.day;
	if (!q.date || q.date === 'Today') {
		const n = new Date();
		return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
	}
	const m = String(q.date).match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
	if (!m) return null;
	const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
	const year = new Date().getFullYear();
	return `${year}-${String(months[m[1].toLowerCase()]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

function renderPatternCalendar(quotes) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const monthName = now.toLocaleString('en-US', { month: 'long' });
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const startDow = new Date(year, month, 1).getDay();
	const byDay = {};
	quotes.forEach(q => {
		const key = quoteDayKey(q);
		if (!key) return;
		(byDay[key] = byDay[key] || []).push(q.theme);
	});
	const cells = [];
	for (let i = 0; i < startDow; i++) cells.push('<span class="pcal-cell spacer"></span>');
	for (let d = 1; d <= daysInMonth; d++) {
		const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		const themes = [...new Set(byDay[key] || [])];
		let cls = 'pcal-cell';
		if (themes.length === 1) cls += ' ' + themes[0];
		else if (themes.length > 1) cls += ' mix';
		const title = themes.length ? themes.map(t => PATTERN_META[t].label).join(', ') : '';
		cells.push(`<span class="${cls}" title="${title}"></span>`);
	}
	return `
	<div class="pcal-card">
		<div class="pcal-kicker">You've Been Noticing</div>
		<div class="pcal-month">${monthName}</div>
		<div class="pcal-dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
		<div class="pcal-grid">${cells.join('')}</div>
		<div class="pcal-legend">
			<span><i class="pcal-cell trust"></i>Trust &amp; Surrender</span>
			<span><i class="pcal-cell patience"></i>Patience</span>
			<span><i class="pcal-cell clarity"></i>Clarity</span>
			<span><i class="pcal-cell mix"></i>More than one</span>
		</div>
	</div>`;
}

function exerciseTabKind() {
	if (App.tier === 'circle' && App.dgeDone) return 'after';
	if (App.tier === 'circle' && App.dgeUnlocked) return 's4';
	if (App.exercises.length >= 3) return 'ready';
	if (App.exercises.length >= 1) return 'few';
	return 'empty';
}

function dgeOfferedOnTab() {
	return App.tier === 'circle' && App.dgeUnlocked && !App.dgeDone;
}

function dgeInFab() {
	return App.tier === 'circle' && (App.dgeUnlocked || App.dgeDone);
}

function krlCardHTML(variant) {
	const cls = variant === 'soft' ? 'hero-card soft' : 'hero-card gradient';
	return `
	<div class="${cls}" onclick="startExercise({returnTab:'exercise'})">
		<div class="kicker">On your own</div>
		<div class="h3">Do a personal exercise</div>
		<p class="caption" style="margin:6px 0 16px;">One situation — warm-up, Listen, Discern, Go. About 10–12 prompts, on your own.</p>
		<button class="btn btn-dark btn-small" onclick="event.stopPropagation();startExercise({returnTab:'exercise'})">Start</button>
	</div>`;
}

function dgeCardHTML(again) {
	return `
	<div class="${again ? 'card outlined static' : 'hero-card gradient'}" ${again ? '' : 'onclick="startDGE()"'}>
		<div class="kicker">Circle \u00b7 The season</div>
		<div class="h3">${again ? 'Do Discernment of Growth Edges again' : 'Discernment of Growth Edges'}</div>
		<p class="caption" style="margin:6px 0 16px;">A second exercise — same three movements, object is the season. Looks across your past exercises; it does not create the patterns.</p>
		<button class="btn ${again ? 'btn-light' : 'btn-dark'} btn-small" onclick="event.stopPropagation();startDGE()">${again ? 'Begin again' : 'Begin'}</button>
	</div>`;
}

function growthList(val) {
	if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
	return String(val || '').split(/\n\n+/).map(s => s.trim()).filter(Boolean);
}

function growthEdgesCardHTML() {
	const edges = growthList(App.growthEdges && App.growthEdges.edges);
	const gos = growthList(App.growthEdges && App.growthEdges.goSteps);
	const edgeChips = edges.length
		? edges.map((t, i) => `<button type="button" class="ge-chip" onclick="editGrowthEdges(${i})">${escapeHtml(t)}</button>`).join('')
		: `<span class="caption">None named yet.</span>`;
	const goChips = gos.length
		? gos.map(t => `<span class="ge-chip go">${escapeHtml(t)}</span>`).join('')
		: '';
	return `
	<div class="hero-card static ge-card">
		<div class="kicker">This season</div>
		<div class="h3">Growth Edges</div>
		<p class="caption" style="margin:6px 0 10px;">Stay editable \u2014 tap a chip to change it. Session 4 often adds to them.</p>
		<div class="ge-chips">${edgeChips}</div>
		${goChips ? `<div class="ge-label">Go steps</div><div class="ge-chips">${goChips}</div>` : ''}
	</div>`;
}

function editGrowthEdges(focusIdx) {
	const list = growthList(App.growthEdges && App.growthEdges.edges);
	dge.edges = [list[0] || '', list[1] || '', list[2] || ''];
	dge.fromEdit = true;
	dge.focus = typeof focusIdx === 'number' ? focusIdx : 0;
	hideTabBar();
	showScreen('exercise-overlay');
	renderDgeEdges();
}

function startDGE() {
	dge.range = 'since';
	dge.fromEdit = false;
	dge.edges = ['', '', ''];
	dge.go = '';
	dge.focus = 0;
	dge.customStart = dge.customStart || '2026-08-01';
	dge.customEnd = dge.customEnd || '2026-08-26';
	hideTabBar();
	showScreen('exercise-overlay');
	renderDgeIntro();
}

const dge = { range: 'since', edges: ['', '', ''], go: '', focus: 0, fromEdit: false, customStart: '2026-08-01', customEnd: '2026-08-26' };

function cancelDGE() {
	showTabBar();
	goTab('exercise');
}

function renderDgeIntro() {
	exOverlay(`
		<button class="btn-ghost back-link" onclick="cancelDGE()">&larr; Back</button>
		<div class="kicker">The season</div>
		<div class="h1" style="margin-bottom:10px;">Discernment of Growth Edges</div>
		<p class="body-text" style="margin-bottom:14px;">God is mostly after formation &mdash; not only guidance for one situation. Growth Edges are 1&ndash;3 invitations for this season. They are an open door, not a demand.</p>
		<p class="caption" style="margin-bottom:24px;">Pattern Recognition looks across your past exercises. The themes are a starting point. You discern what, if anything, is an invitation.</p>
		<button class="btn btn-dark btn-block-mt" onclick="renderDgeRange()">Begin</button>
		<div style="height:16px"></div>`);
}

function dgeLastLabel() {
	if (!App.lastDgeDay) return 'You haven\u2019t done this yet \u2014 this uses all the exercises you have.';
	const [y, m, d] = App.lastDgeDay.split('-');
	const label = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	return 'Exercises since ' + label + '.';
}

function renderDgeRange() {
	const sinceOn = dge.range === 'since';
	const customOn = dge.range === 'custom';
	exOverlay(`
		<button class="btn-ghost back-link" onclick="renderDgeIntro()">&larr; Back</button>
		<div class="h1" style="margin-bottom:8px;">Date range</div>
		<p class="caption" style="margin-bottom:16px;">This filters which past exercises Pattern Recognition includes. It does not create the patterns.</p>
		<button type="button" class="path-option${sinceOn ? ' selected' : ''}" data-dge-range="since" onclick="selectDgeRange('since')">
			<span class="path-radio"></span>
			<span><div class="h3">Since last Growth Edges</div><p class="caption">${escapeHtml(dgeLastLabel())}</p></span>
		</button>
		<button type="button" class="path-option${customOn ? ' selected' : ''}" data-dge-range="custom" onclick="selectDgeRange('custom')">
			<span class="path-radio"></span>
			<span><div class="h3">Choose start and end</div><p class="caption">Pick a window of situations to include.</p></span>
		</button>
		${customOn ? `
		<div class="dge-dates">
			<label class="ge-label">Start</label>
			<input type="date" class="input-box" value="${escapeHtml(dge.customStart)}" oninput="dge.customStart=this.value">
			<label class="ge-label">End</label>
			<input type="date" class="input-box" value="${escapeHtml(dge.customEnd)}" oninput="dge.customEnd=this.value">
		</div>` : ''}
		<button class="btn btn-dark btn-block-mt" onclick="renderDgeGather()">Look across these</button>
		<div style="height:16px"></div>`);
}

function selectDgeRange(id) {
	dge.range = id;
	renderDgeRange();
}

function exerciseDayKey(e) {
	const days = (e.quotes || []).map(q => q.day).filter(Boolean).sort();
	return days[0] || '';
}

function dgeFilteredExercises() {
	const all = App.exercises.slice();
	if (dge.range === 'custom') {
		const start = dge.customStart || '0000-01-01';
		const end = dge.customEnd || '9999-12-31';
		return all.filter(e => {
			const d = exerciseDayKey(e);
			return d && d >= start && d <= end;
		});
	}
	if (!App.lastDgeDay) return all;
	return all.filter(e => {
		const d = exerciseDayKey(e);
		return d && d > App.lastDgeDay;
	});
}

function dgeThemeGroups() {
	const byTheme = {};
	dgeFilteredExercises().forEach(e => {
		(e.quotes || []).forEach(q => {
			(byTheme[q.theme] = byTheme[q.theme] || []).push(Object.assign({ situation: e.situation }, q));
		});
	});
	return PATTERN_ORDER.filter(t => byTheme[t] && byTheme[t].length).map(theme => ({
		theme,
		meta: PATTERN_META[theme],
		quotes: byTheme[theme]
	}));
}

function renderDgeGather() {
	exOverlay(`
		<div class="dge-gather">
			<div class="kicker">Pattern Recognition</div>
			<div class="h2" style="margin:10px 0 12px;">Looking across your situations</div>
			<p class="caption">Themes will land as cards you can sit with &mdash; not a verdict.</p>
		</div>`);
	setTimeout(function() { renderDgeThemes(); }, 1400);
}

function renderDgeThemes() {
	const groups = dgeThemeGroups();
	const count = dgeFilteredExercises().length;
	const cards = groups.length ? groups.map(g => `
		<div class="dge-theme">
			<div class="kicker">${g.quotes.length} across ${count} situation${count === 1 ? '' : 's'}</div>
			<div class="h3">${g.meta.label}</div>
			${g.quotes.slice(0, 2).map(q => `<p class="dge-theme-quote">\u201C${escapeHtml(q.text)}\u201D</p>`).join('')}
		</div>`).join('') : `<p class="caption">Not enough in this range yet. Try a wider window.</p>`;
	exOverlay(`
		<button class="btn-ghost back-link" onclick="renderDgeRange()">&larr; Back</button>
		<div class="h1" style="margin-bottom:6px;">What keeps showing up</div>
		<p class="caption" style="margin-bottom:12px;">Scroll the cards. Sit with them. These are starting points &mdash; not your Growth Edges yet.</p>
		<div class="dge-rail">${cards}</div>
		<button class="btn btn-dark btn-block-mt" onclick="renderDgeEdges()">Name Growth Edges</button>
		<div style="height:16px"></div>`);
}

function renderDgeEdges() {
	exOverlay(`
		<button class="btn-ghost back-link" onclick="${dge.fromEdit ? 'cancelDGE()' : 'renderDgeThemes()'}">&larr; Back</button>
		<div class="h1" style="margin-bottom:6px;">Name 1&ndash;3 Growth Edges</div>
		<p class="caption" style="margin-bottom:14px;">You name them. Type, or speak and we&rsquo;ll turn it into text &mdash; we don&rsquo;t extract or decide the edges for you. 1&ndash;3 sentences each is enough.</p>
		<label class="ge-label">Growth Edge 1</label>
		<textarea class="dge-edge${dge.focus === 0 ? ' selected' : ''}" rows="3" onfocus="dgeFocusEdge(0)" id="dge-e0">${escapeHtml(dge.edges[0])}</textarea>
		<label class="ge-label">Growth Edge 2 (optional)</label>
		<textarea class="dge-edge${dge.focus === 1 ? ' selected' : ''}" rows="2" onfocus="dgeFocusEdge(1)" id="dge-e1">${escapeHtml(dge.edges[1])}</textarea>
		<label class="ge-label">Growth Edge 3 (optional)</label>
		<textarea class="dge-edge${dge.focus === 2 ? ' selected' : ''}" rows="2" onfocus="dgeFocusEdge(2)" id="dge-e2">${escapeHtml(dge.edges[2])}</textarea>
		<p class="caption" style="margin:4px 0 12px;">Type in a field, or speak into the one you tapped last.</p>
		<div class="input-triad">
			<div class="triad-buttons">
				<button type="button" class="triad-btn" onclick="dgeSpeakIntoFocus()">
					${glyphIcon('speak')}<span class="triad-btn-label">Speak</span>
				</button>
			</div>
		</div>
		<button class="btn btn-dark btn-block-mt" onclick="finishDGE()">Save this season</button>
		<div style="height:16px"></div>`);
}

function dgeFocusEdge(i) {
	dge.focus = i;
	document.querySelectorAll('.dge-edge').forEach((el, idx) => el.classList.toggle('selected', idx === i));
}

function dgeSpeakIntoFocus() {
	const i = typeof dge.focus === 'number' ? dge.focus : 0;
	const transcript = TRIAD_TRANSCRIPTS[_triadTranscriptCursor % TRIAD_TRANSCRIPTS.length];
	_triadTranscriptCursor++;
	dge.edges[i] = transcript;
	const el = document.getElementById('dge-e' + i);
	if (el) {
		el.value = transcript;
		el.classList.add('selected');
	}
}

function collectDgeEdges() {
	[0, 1, 2].forEach(i => {
		const el = document.getElementById('dge-e' + i);
		if (el) dge.edges[i] = el.value.trim();
	});
}

function finishDGE() {
	collectDgeEdges();
	const named = dge.edges.filter(Boolean);
	App.growthEdges.edges = named;
	App.dgeDone = true;
	App.dgeUnlocked = true;
	App.lastDgeDay = '2026-08-26';
	showTabBar();
	goTab('exercise');
}

function renderExerciseTab() {
	const stack = document.getElementById('exercise-tab-stack');
	if (!stack) return;
	const sub = App.exerciseSubtab === 'past' ? 'past' : 'patterns';
	stack.innerHTML = `
		<div class="ex-subnav" role="tablist">
			<button type="button" class="ex-subnav-btn${sub === 'patterns' ? ' active' : ''}" role="tab" aria-selected="${sub === 'patterns'}" onclick="setExerciseSubtab('patterns')">Patterns</button>
			<button type="button" class="ex-subnav-btn${sub === 'past' ? ' active' : ''}" role="tab" aria-selected="${sub === 'past'}" onclick="setExerciseSubtab('past')">Past</button>
		</div>
		<div id="exercise-subtab-body"></div>
		<div style="height:72px"></div>`;
	if (sub === 'past') renderExercisePastPane();
	else renderExercisePatternsPane();
	syncExerciseFab();
}

function setExerciseSubtab(id) {
	App.exerciseSubtab = id;
	renderExerciseTab();
}

function renderExercisePatternsPane() {
	const el = document.getElementById('exercise-subtab-body');
	if (!el) return;
	const parts = [];
	if (App.tier === 'circle' && App.dgeDone) parts.push(growthEdgesCardHTML());
	if (dgeOfferedOnTab()) parts.push(dgeCardHTML(false));
	parts.push('<div id="exercise-patterns-slot"></div>');
	el.innerHTML = parts.join('');
	renderPatterns('exercise-patterns-slot');
}

function renderExercisePastPane() {
	const el = document.getElementById('exercise-subtab-body');
	if (!el) return;
	const q = App.pastSearch || '';
	el.innerHTML = `
		<input type="search" class="input-box past-search" id="past-search" placeholder="Search past exercises" value="${escapeHtml(q)}" oninput="filterPastExercises(this.value)">
		<div id="exercise-past-list"></div>`;
	renderPastExercises('exercise-past-list');
}

function filterPastExercises(q) {
	App.pastSearch = q;
	renderPastExercises('exercise-past-list');
}

function exerciseFabOn() {
	return true;
}

function syncExerciseFab() {
	const fab = document.getElementById('ex-fab');
	const bar = document.querySelector('.tab-bar');
	if (!fab || !bar) return;
	const show = exerciseFabOn() && App.currentTab === 'exercise' && bar.style.display !== 'none';
	fab.classList.toggle('visible', show);
	if (!show) closeExerciseFab();
}

function toggleExerciseFab(e) {
	if (e) e.stopPropagation();
	const sheet = document.getElementById('ex-fab-sheet');
	if (!sheet) return;
	if (sheet.classList.contains('open')) closeExerciseFab();
	else openExerciseFab();
}

function openExerciseFab() {
	const sheet = document.getElementById('ex-fab-sheet');
	if (!sheet) return;
	const dgeOn = dgeInFab();
	const dgeAgain = App.dgeDone;
	sheet.innerHTML = `
		<div class="ex-fab-pop" onclick="event.stopPropagation()">
			<button type="button" class="ex-fab-opt" onclick="closeExerciseFab();startExercise({returnTab:'exercise'})">
				<div class="kicker">On your own</div>
				<div class="h3">A personal exercise</div>
				<p class="caption" style="margin:0;">One situation — warm-up, Listen, Discern, Go.</p>
			</button>
			${dgeOn ? `<button type="button" class="ex-fab-opt" onclick="closeExerciseFab();startDGE()">
				<div class="kicker">Circle \u00b7 The season</div>
				<div class="h3">${dgeAgain ? 'Do Discernment of Growth Edges again' : 'Discernment of Growth Edges'}</div>
				<p class="caption" style="margin:0;">${dgeAgain ? 'Look across the season again.' : 'Look across this season of practice.'}</p>
			</button>` : ''}
		</div>`;
	sheet.classList.add('open');
}

function closeExerciseFab() {
	const sheet = document.getElementById('ex-fab-sheet');
	if (sheet) { sheet.classList.remove('open'); sheet.innerHTML = ''; }
}

function renderHomeExerciseCard() {
	const el = document.getElementById('home-exercise-slot');
	if (!el) return;
	const prepActive = App.tier === 'circle' && !App.prep.homeDismissed && prepDoneCount() < 3;
	if (prepActive || App.exercises.length > 0) {
		el.innerHTML = '';
		return;
	}
	el.innerHTML = `
	<div class="hero-card gradient" onclick="startExercise({returnTab:'home'})">
		<div class="kicker">Personal Exercise</div>
		<div class="h3">Do an exercise</div>
		<p class="caption" style="margin:6px 0 16px;">About 10–15 min, on your own, whenever you have a quiet moment. After this, start from + on Exercises.</p>
		<button class="btn btn-dark btn-small" onclick="event.stopPropagation();startExercise({returnTab:'home'})">Begin</button>
	</div>`;
}

function renderPatterns(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	const count = App.exercises.length;
	if (count < 3) {
		el.innerHTML = `
		<div class="pattern-gate-card">
			<span class="pattern-lock-icon">&#128274;</span>
			<div class="h3" style="margin-bottom:6px;">Patterns are almost unlocked</div>
			<p class="caption">Complete 3 exercises to unlock your Patterns — you've done ${count} of 3.</p>
			<div class="pattern-gate-dots">
				${[0, 1, 2].map(i => `<span class="streak-dot${i < count ? ' done' : ''}"></span>`).join('')}
			</div>
		</div>`;
		return;
	}
	if (App.tier !== 'circle') {
		el.innerHTML = `
		<div class="pattern-gate-card">
			<span class="pattern-lock-icon">&#128274;</span>
			<div class="h3" style="margin-bottom:6px;">Patterns are ready</div>
			<p class="caption" style="margin-bottom:16px;">Upgrade to see the themes across your ${count} exercises.</p>
			<button class="btn btn-dark btn-small" onclick="showStub('Upgrade to unlock Patterns', 'Patterns are part of Growth Edges or Circle Community access. This demo doesn\\'t include a working purchase flow.', 'Back', function(){ goTab(App.currentTab); })">Upgrade</button>
		</div>`;
		return;
	}
	const quotes = getAllQuotes();
	const byTheme = {};
	quotes.forEach(q => { (byTheme[q.theme] = byTheme[q.theme] || []).push(q); });
	const aiLink = `<p class="caption" style="text-align:right;margin:-4px 0 12px;"><a href="javascript:void(0)" onclick="showAIInfo('${App.currentTab}', function(){ renderPatterns('${containerId}'); })" style="color:var(--muted);text-decoration:underline;">How is AI used?</a></p>`;
	const cards = PATTERN_ORDER.filter(t => byTheme[t] && byTheme[t].length).map(themeKey => {
		const qs = byTheme[themeKey];
		const meta = PATTERN_META[themeKey];
		const max = Math.max.apply(null, PATTERN_ORDER.map(k => (byTheme[k] || []).length).concat([1]));
		const ratio = qs.length / max;
		const size = ratio >= 0.75 ? 'size-l' : ratio >= 0.4 ? 'size-m' : 'size-s';
		return `
		<div class="pattern-theme-card ${size}">
			<div class="pattern-theme-header">
				<span class="pattern-theme-icon">${meta.icon}</span>
				<span class="pattern-theme-name">${meta.label}</span>
				<span class="pattern-theme-count">${qs.length} entr${qs.length === 1 ? 'y' : 'ies'}</span>
			</div>
			${qs.slice(0, 3).map(q => `<div class="pattern-quote">\u201C${escapeHtml(q.text)}\u201D<span class="pattern-quote-date">${escapeHtml(q.date)}</span></div>`).join('')}
		</div>`;
	}).join('');
	el.innerHTML = aiLink + cards;
}

/* -------------------------------------------------------------------------
   Past Exercises list (both tiers)
   ------------------------------------------------------------------------- */
function renderPastExercises(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	if (!App.exercises.length) {
		el.innerHTML = `<p class="caption" style="text-align:center;padding:28px 12px;">No exercises yet. Tap + to start one.</p>`;
		return;
	}
	const q = String(App.pastSearch || '').trim().toLowerCase();
	const items = App.exercises.slice().reverse().filter(rec => {
		if (!q) return true;
		const hay = [
			rec.date, rec.situation, rec.themes, rec.heartPosture, rec.nextSteps,
			...(rec.quotes || []).map(x => x.text)
		].join(' ').toLowerCase();
		return hay.indexOf(q) !== -1;
	});
	if (!items.length) {
		el.innerHTML = `<p class="caption" style="text-align:center;padding:20px 12px;">Nothing matches that search.</p>`;
		return;
	}
	el.innerHTML = items.map(rec => {
		const tags = [...new Set((rec.quotes || []).map(x => x.theme))].map(t => `<span class="tag outline">${PATTERN_META[t].label}</span>`).join(' ');
		return `
		<div class="card outlined" onclick="openPastRecap(${rec.id})">
			<div class="caption" style="margin-bottom:4px;">${escapeHtml(rec.date)}</div>
			<div class="body-text" style="font-size:14px;margin-bottom:8px;">${escapeHtml(rec.situation)}</div>
			<div class="output-tags">${tags}</div>
		</div>`;
	}).join('');
}

function openPastRecap(id) {
	const rec = App.exercises.find(e => e.id === id);
	if (!rec) return;
	const data = recapFromRecord(rec);
	hideTabBar();
	showScreen('exercise-overlay');
	exOverlay(`
		<button class="btn-ghost back-link" onclick="closePastRecap()">&larr; Back</button>
		${recapChromeHTML()}
		<div class="recap-scroll">
		${recapCardsHTML(data, `showAIInfo('exercise-overlay', function(){ openPastRecap(${id}); })`)}
		</div>
		<div style="height:16px"></div>`);
}

function closePastRecap() {
	showTabBar();
	goTab('exercise');
}

/* ==========================================================================
   SESSION 1 PREP — container: intro -> {Classroom set, Exercise, Reflect}
   ========================================================================== */
function checkPrepClassroomComplete() {
	const anySession1Watched = CLASSROOM_CHUNKS.some((c, i) => c.session1 && App.classroomWatched.has(i));
	App.prep.classroom = anySession1Watched;
}

function prepDoneCount() {
	return ['classroom', 'exercise', 'reflect'].filter(k => App.prep[k]).length;
}

function prepStackHTML(opts) {
	opts = opts || {};
	const doneCount = prepDoneCount();
	const allDone = doneCount === 3;
	const toChecklist = allDone || doneCount > 0;
	const title = opts.sessionTitle || 'Session 1';
	const collapsible = !!opts.collapsible;
	const open = collapsible ? !!opts.open : true;
	const ret = opts.returnScreen || '';
	const flowArg = `{toChecklist:${toChecklist}${ret ? `, returnScreen:'${ret}'` : ''}}`;
	const cta = allDone ? 'Open checklist' : doneCount > 0 ? 'Continue prep' : "Let's get prepped";
	const heading = allDone ? (opts.readyLabel || "You're ready for Session 1") : 'Prep for the gathering';
	const headRight = collapsible
		? `<button type="button" class="prep-collapse-btn" onclick="event.stopPropagation();togglePrepStack()" aria-expanded="${open ? 'true' : 'false'}" aria-controls="acc-prep-rows" aria-label="${open ? 'Collapse prep' : 'Expand prep'}">&#9662;</button>`
		: `<div class="session-menu">
				<button type="button" class="session-menu-btn" onclick="event.stopPropagation();toggleSessionMenu(event)" aria-label="Session options" aria-expanded="false">&#8942;</button>
				<div class="session-menu-dropdown" hidden>
					<button type="button" class="session-menu-item" onclick="event.stopPropagation();markSessionCompleted(0)">Mark Session 1 completed</button>
				</div>
			</div>`;
	const heroClick = collapsible ? '' : ` onclick="startPrepFlow(${flowArg})"`;
	return `
	<div class="home-prep-stack${collapsible ? ' collapsible' : ''}${collapsible && open ? ' open' : ''}"${collapsible ? ' id="acc-prep"' : ''}>
		<div class="hero-card gradient prep-home-card"${heroClick}>
			<div class="prep-card-head">
				<div class="kicker">${escapeHtml(title)} \u00b7 On your own</div>
				${headRight}
			</div>
			<b style="font-size:16px;display:block;margin-bottom:4px;">${heading}</b>
			<p class="caption" style="margin-bottom:16px;">This will help you show up for Circle.</p>
			<button class="btn btn-dark btn-small" onclick="event.stopPropagation();startPrepFlow(${flowArg})">${cta}</button>
		</div>
		<div class="card static prep-rows-card"${collapsible ? ' id="acc-prep-rows"' : ''}>
			${prepStepRowsHTML(ret || undefined)}
		</div>
	</div>`;
}

function prepStepRowsHTML(returnScreen) {
	const retArg = returnScreen ? `, '${returnScreen}'` : '';
	const row = (done, step, title, caption) => `
		<button type="button" class="prep-step" onclick="event.stopPropagation();openPrepStep('${step}'${retArg})">
			<div class="chk-circle${done ? ' done' : ''}">${done ? '&#10003;' : ''}</div>
			<div class="prep-step-body">
				<b>${escapeHtml(title)}</b>
				<p class="caption">${done ? 'Done' : escapeHtml(caption)}</p>
			</div>
			${done ? '' : '<span class="prep-step-chevron" aria-hidden="true">&#8250;</span>'}
		</button>`;
	return `<div class="prep-steps">
		${row(App.prep.classroom, 'classroom', 'Learning', 'Short pieces for this session — not the whole library.')}
		${row(App.prep.exercise, 'exercise', 'Personal exercise', 'A guided exercise on your own, in service of this gathering.')}
		${row(App.prep.reflect, 'reflect', 'Reflect', 'Name one takeaway to bring into the room.')}
	</div>`;
}

function openPrepStep(step, returnScreen) {
	startPrepFlow({ toChecklist: true, returnScreen: returnScreen || null });
	if (step === 'classroom') prepShowClassroom();
	else if (step === 'exercise') prepGoExercise();
	else if (step === 'reflect') prepShowReflect();
}

let _prepReturnScreen = null;

function startPrepFlow(opts) {
	_prepReturnScreen = (opts && opts.returnScreen) || null;
	hideTabBar();
	showScreen('prep-overlay');
	if (opts && opts.toChecklist) prepShowChecklist();
	else prepShowIntro();
}

function closePrepOverlay() {
	showTabBar();
	if (_prepReturnScreen === 'connect-session-overlay') {
		_prepReturnScreen = null;
		openConnectSession(currentSessionIdx);
		return;
	}
	_prepReturnScreen = null;
	goTab(App.currentTab);
}

function prepOverlay(html) {
	document.getElementById('prep-overlay-body').innerHTML = html;
}

function prepShowIntro() {
	showTabBar();
	prepOverlay(`
		<button class="btn-ghost back-link" onclick="closePrepOverlay()">&larr; Back</button>
		<div class="h1" style="margin-bottom:12px;">Getting ready for the Circle</div>
		<p class="body-text" style="margin-bottom:20px;">Session 1 is coming up. Spend a few unhurried minutes on your own — a short Learning piece, a personal exercise, and Reflect. Together, they'll help you show up for Circle.</p>
		<button class="btn btn-dark btn-block-mt" onclick="prepShowChecklist()">Let's Get Prepped &rarr;</button>
		<div style="height:16px"></div>`);
}

function prepShowChecklist() {
	showTabBar();
	const doneCount = prepDoneCount();
	const allDone = doneCount === 3;
	prepOverlay(`
		<button class="btn-ghost back-link" onclick="closePrepOverlay()">&larr; Back to Home</button>
		<div class="h1" style="margin-bottom:6px;">Your Prep Checklist</div>
		<p class="prep-progress-caption">${doneCount} of 3 complete</p>
		<div class="card outlined prep-checklist-item" onclick="prepShowClassroom()">
			<div class="chk-circle${App.prep.classroom ? ' done' : ''}">${App.prep.classroom ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Learning</b><p class="caption" style="margin:0;">A few short pieces for this session.</p></div>
		</div>
		<div class="card outlined prep-checklist-item" onclick="prepGoExercise()">
			<div class="chk-circle${App.prep.exercise ? ' done' : ''}">${App.prep.exercise ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Personal Exercise</b><p class="caption" style="margin:0;">Complete your personal exercise — done on your own.</p></div>
		</div>
		<div class="card outlined prep-checklist-item" onclick="prepShowReflect()">
			<div class="chk-circle${App.prep.reflect ? ' done' : ''}">${App.prep.reflect ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Reflect &amp; Prep</b><p class="caption" style="margin:0;">One takeaway to bring to the group.</p></div>
		</div>
		${allDone ? `<button class="btn btn-dark btn-block-mt" onclick="closePrepOverlay()">Done</button>` : ''}
		<div style="height:16px"></div>`);
}

function prepShowClassroom() {
	prepOverlay(`
		<button class="btn-ghost back-link" onclick="prepShowChecklist()">&larr; Back to Prep</button>
		<div class="h1" style="margin-bottom:6px;">Learning</div>
		<p class="caption" style="margin-bottom:4px;">A short set of pieces bundled for Session 1.</p>
		<p class="classroom-progress-text" id="prep-classroom-progress"></p>
		<div id="prep-classroom-list"></div>
		<button class="btn btn-dark btn-block-mt" onclick="prepShowChecklist()">Back to Prep &rarr;</button>
		<div style="height:16px"></div>`);
	renderClassroomList('prep-classroom-list', 'prep-classroom-progress', true, 'prep-overlay');
}

function prepGoExercise() {
	startExercise({ fromPrep: true });
}

function prepShowReflect() {
	prepOverlay(`
		<button class="btn-ghost back-link" onclick="prepShowChecklist()">&larr; Back to Prep</button>
		<div class="h1" style="margin-bottom:6px;">Reflect &amp; Prep</div>
		<p class="body-text" style="margin-bottom:8px;">What is one takeaway you want to share with your group tonight?</p>
		${renderInputTriadHTML('triad-reflect')}
		<button class="btn btn-dark btn-block-mt" onclick="prepSubmitReflect()">Submit</button>
		<div style="height:16px"></div>`);
}

function prepSubmitReflect() {
	App.prep.reflect = true;
	prepShowChecklist();
}

function prepFinishSession1() {
	App.prep.homeDismissed = true;
	closePrepOverlay();
	showToast('You can still find Session 1 prep in Circle whenever you need it.');
}

let _toastTimer = null;
function showToast(message) {
	const frame = document.querySelector('.phone-frame');
	if (!frame) return;
	let el = document.getElementById('app-toast');
	if (!el) {
		el = document.createElement('div');
		el.id = 'app-toast';
		el.className = 'toast';
		frame.appendChild(el);
	}
	el.textContent = message;
	el.classList.add('show');
	clearTimeout(_toastTimer);
	_toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}

/* ==========================================================================
   FACILITATOR GUIDE (Connect, paid-circle only) — Session 1 only this round
   Client-provided copy, adapted from round-1's shared-facilitator.js
   ========================================================================== */
const FAC_NOTE = {
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

const SECTION_TEMPLATES = {
	arrival: {
		name: "Arrival & Grounding",
		subs: [
			{ title: "Welcome & Opening", readAloud: true,
				keyPoints: ["Welcome everyone as they arrive", "Name tonight's flow in one line", "Invite a moment of silence before starting"],
				script: `Welcome, everyone. <b>I'm so glad you're here tonight.</b> Let's take a second to arrive — set down whatever you carried in with you today. <i>[Pause]</i> Tonight we'll spend some time in breakouts sharing where we've each noticed God's presence this week, then come back together before we close.` },
			{ title: "Grounding Exercise", readAloud: true,
				keyPoints: ["Settle the body — breath, posture, senses", "Invite noticing, no need to share", "Go slowly; leave space between prompts"],
				script: `Let's take a moment to settle in together. Close your eyes if that's comfortable, or simply soften your gaze. <i>[Pause]</i> Notice your breath — you don't need to change it, just notice it. <i>[Pause]</i> Notice the weight of your body in the chair. <b>There's nowhere else you need to be right now.</b> <i>[Pause]</i> When you're ready, gently open your eyes.` }
		]
	},
	breakouts: {
		name: "Breakouts",
		subs: [
			{ title: "Breakout instructions and timing", readAloud: false,
				keyPoints: ["Groups of 3 (4–5 max if needed)", "~7 min per person total", "3–5 min sharing, remainder for listener response", "Facilitators assign or let groups form freely", "One volunteer reads guidance aloud before starting"],
				script: `Split into groups of three, or four to five if needed. Each person gets about seven minutes total — three to five minutes to share, with the remainder for listener response. <b>Facilitators can assign groups or let them form freely.</b> Before starting, ask one volunteer in each group to read the sharing and listening guidance aloud. <i>[Pause]</i>` },
			{ title: "Guidance for sharing and listening", readAloud: true,
				keyPoints: ["Share to deepen your own discernment", "Listeners hold space, don't fix or advise", "Passing is always okay"],
				script: `Before you begin sharing, a quick word on how this works. The purpose of sharing is for you, the speaker, to voice, clarify, claim, and act on your own best sense of God's guidance — not for the listener to understand every detail.<br><br>If you're listening, your job is simple: be a loving, attentive presence. You don't need to fix anything, offer advice, or fully understand the situation. <i>[Pause]</i> And remember — you can always say "pass" if you'd rather not share today.` }
		]
	},
	debrief: {
		name: "Large Group Debrief",
		subs: [
			{ title: "Reconvene & Synthesize", readAloud: true,
				keyPoints: ["Welcome the group back together", "Ask what themes emerged across breakouts", "Name one thread worth carrying forward"],
				script: `Welcome back, everyone. Before we close, let's name a few things out loud. <b>Without sharing anything private,</b> what themes came up in your breakout? <i>[Pause]</i> Is there a thread here that feels important for our whole group to carry forward this week?` }
		]
	},
	close: {
		name: "Close",
		subs: [
			{ title: "Closing Blessing", readAloud: true,
				keyPoints: ["Thank the group for showing up", "Invite one word or takeaway in silence", "Close with a brief blessing"],
				script: `Thank you all for being here and for the honesty you brought tonight. <b>Before we go, let's each hold one word</b> from tonight in silence. <i>[Pause]</i> Go in peace this week — trust what you noticed, and be gentle with yourself as you live it out.` }
		]
	}
};

const SECTION_ORDER = ['arrival', 'breakouts', 'debrief', 'close'];
const SESSION_TIMES = [
	{ arrival: [0, 15], breakouts: [15, 40], debrief: [40, 52], close: [52, 60] },
	{ arrival: [0, 15], breakouts: [15, 45], debrief: [45, 55], close: [55, 60] },
	{ arrival: [0, 10], breakouts: [10, 40], debrief: [40, 52], close: [52, 60] },
	{ arrival: [0, 15], breakouts: [15, 35], debrief: [35, 50], close: [50, 60] }
];
const CIRCLE_SESSIONS = SESSION_TIMES.map((times, i) => ({
	id: i + 1,
	title: `Session ${i + 1}`,
	status: 'Upcoming',
	sections: SECTION_ORDER.map(key => ({
		id: key,
		name: SECTION_TEMPLATES[key].name,
		start: times[key][0],
		end: times[key][1],
		subs: SECTION_TEMPLATES[key].subs
	}))
}));

let currentSessionIdx = 0;
function currentSession() { return CIRCLE_SESSIONS[currentSessionIdx]; }

function flattenPieces() {
	const flat = [];
	currentSession().sections.forEach((sec, si) => sec.subs.forEach((sub, bi) => flat.push({ sec, sub, si, bi })));
	return flat;
}

function renderTabCard(sub, key) {
	return `
	<div class="tab-card" data-key="${key}">
		<div class="tab-card-title">${escapeHtml(sub.title)}</div>
		<div class="guide-mode">
			<button class="guide-mode-btn active" onclick="switchCardTab(this,'key')">Key Points</button>
			<button class="guide-mode-btn" onclick="switchCardTab(this,'script')">Full Script</button>
			<button class="guide-mode-btn" onclick="switchCardTab(this,'play')">Play</button>
		</div>
		<div class="tab-panel" data-mode="key">
			<ul class="key-points-list">${sub.keyPoints.map(k => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
		</div>
		<div class="tab-panel" data-mode="script" style="display:none">
			${sub.readAloud ? '<span class="read-aloud-tag">Read aloud to the small group</span>' : ''}
			<div class="script-text">${sub.script}</div>
		</div>
		<div class="tab-panel" data-mode="play" style="display:none">
			<div class="guide-audio-box">
				<div class="guide-audio-bars">${[12, 22, 16, 28, 18].map((h, i) => `<div class="guide-audio-bar" style="height:${h}px;animation-delay:${(i * 0.2).toFixed(1)}s"></div>`).join('')}</div>
				<p>[ Tap to play audio: ${escapeHtml(sub.title)} ]</p>
			</div>
		</div>
	</div>`;
}

function toggleFacNote() { document.getElementById('fac-note').classList.toggle('collapsed'); }

function renderConnectLanding() {
	const overview = document.getElementById('connect-overview-slot');
	const list = document.getElementById('connect-sessions');
	if (!overview || !list) return;
	overview.innerHTML = `
		<button type="button" class="connect-overview" onclick="openCircleOverview()">
			<div class="topic-card-art art-b" style="height:132px;margin-bottom:10px;">
				<span class="topic-kind">Video</span>
				<span class="topic-play">&#9654;</span>
			</div>
			<div class="topic-card-title">The Circle Experience</div>
			<div class="topic-card-sub">Video \u00b7 2 min \u00b7 How a Circle works together</div>
		</button>`;
	list.innerHTML = CIRCLE_SESSIONS.map((s, i) => `
		<div class="card outlined" onclick="openConnectSession(${i})">
			<div class="kicker">${escapeHtml(s.status)} \u00b7 60 min</div>
			<b style="font-size:16px;display:block;margin-bottom:4px;">${escapeHtml(s.title)}</b>
			<p class="caption" style="margin:0;">Prepare on your own, or open the gathering when you are together.</p>
		</div>`).join('');
}

function openCircleOverview() {
	openMediaFeed([{
		title: 'The Circle Experience',
		duration: '2 min',
		desc: 'A Circle is a small group moving through a shared season together. You prepare on your own. You gather in person. Prep and the gathering stay separate — and Facilitator Mode is there when you need it in the room.',
		badge: 'Circle'
	}], 0, 'connect');
}

function gatheringAgendaHTML(session) {
	return `
		<div class="fac-note collapsed" id="fac-note">
			<div class="fac-note-header" onclick="toggleFacNote()">
				<span class="fac-note-icon">&#128161;</span>
				<span class="fac-note-title">${FAC_NOTE.title}</span>
				<span class="fac-note-chevron">&#9662;</span>
			</div>
			<div class="fac-note-body">${FAC_NOTE.body}</div>
		</div>
		${session.sections.map((sec, si) => `
			<div class="section-group">
				<div class="section-group-title"><span>${escapeHtml(sec.name)}</span><span>${sec.start}\u2013${sec.end} min</span></div>
				${sec.subs.map((sub, bi) => `
					<div class="guide-item" onclick="openGuidePiece(${si},${bi})">
						<div class="guide-num">${bi + 1}</div>
						<div class="guide-text"><div class="title">${escapeHtml(sub.title)}</div><div class="sub">${sub.readAloud ? 'Read aloud to the small group' : 'Facilitator instructions'}</div></div>
					</div>`).join('')}
			</div>`).join('')}`;
}

function openConnectSession(idx, opts) {
	currentSessionIdx = idx;
	const session = currentSession();
	const facItem = `<button type="button" class="session-menu-item" onclick="startFacilitatorMode()">Facilitator Mode</button>`;
	document.getElementById('connect-session-body').innerHTML = `
		<button class="btn-ghost back-link" onclick="goTab('connect')">&larr; Back to Circle</button>
		<div class="kicker">Circle</div>
		<div class="session-title-row">
			<div class="h1" style="margin:0;">${escapeHtml(session.title)}</div>
			<div class="session-menu">
				<button type="button" class="session-menu-btn" onclick="toggleSessionMenu(event)" aria-label="Session options" aria-expanded="false">&#8942;</button>
				<div class="session-menu-dropdown" hidden>
					${facItem}
					${session.status === 'Completed' ? '' : `<button type="button" class="session-menu-item" onclick="markSessionCompleted()">Mark ${escapeHtml(session.title)} completed</button>`}
				</div>
			</div>
		</div>
		<p class="caption" style="margin-bottom:18px;">${escapeHtml(session.status)} \u00b7 60 min gathering</p>
		${prepStackHTML({
			collapsible: true,
			open: true,
			sessionTitle: session.title,
			returnScreen: 'connect-session-overlay',
			readyLabel: "You're ready for this gathering"
		})}
		<div class="session-room-block">
			<div class="kicker">Together</div>
			<b>In the room</b>
			<p class="caption">Agenda for the gathering.</p>
			${gatheringAgendaHTML(session)}
		</div>
		<div style="height:16px"></div>`;
	showTabBar();
	showScreen('connect-session-overlay');
}

function togglePrepStack() {
	const prep = document.getElementById('acc-prep');
	if (!prep) return;
	const open = prep.classList.toggle('open');
	const btn = prep.querySelector('.prep-collapse-btn');
	if (btn) {
		btn.setAttribute('aria-expanded', open ? 'true' : 'false');
		btn.setAttribute('aria-label', open ? 'Collapse prep' : 'Expand prep');
	}
}

function openGatheringAgenda() {
	openConnectSession(currentSessionIdx, { room: true });
}

function switchCardTab(btn, mode) {
	const card = btn.closest('.tab-card');
	card.querySelectorAll('.guide-mode-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	card.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.dataset.mode === mode ? 'block' : 'none');
}

let currentPieceFlat = -1;

function openGuidePiece(si, bi) {
	const flat = flattenPieces();
	currentPieceFlat = flat.findIndex(p => p.si === si && p.bi === bi);
	renderCurrentPiece();
	showScreen('guide-piece-overlay');
}

function renderCurrentPiece() {
	const flat = flattenPieces();
	const piece = flat[currentPieceFlat];
	document.getElementById('guide-piece-body').innerHTML = `
		<div class="guide-detail-header">
			<button class="btn-ghost" style="font-size:18px;" onclick="closeGuidePiece()">&larr;</button>
			<div class="guide-badge">${currentPieceFlat + 1}</div>
			<div><div class="h3" style="font-size:16px;">${escapeHtml(piece.sub.title)}</div><div class="caption">${escapeHtml(piece.sec.name)} \u00b7 min ${piece.sec.start}\u2013${piece.sec.end}</div></div>
		</div>
		<div style="flex:1;overflow-y:auto;">${renderTabCard(piece.sub, `detail-${piece.si}-${piece.bi}`)}</div>
		<div class="guide-section-nav">
			<button class="guide-sec-btn gray" ${currentPieceFlat === 0 ? 'disabled' : ''} onclick="detailPrev()">&larr; Previous</button>
			<button class="guide-sec-btn dark" onclick="detailNext()">${currentPieceFlat === flat.length - 1 ? 'Done \u2192' : 'Next \u2192'}</button>
		</div>`;
}

function detailNext() {
	const flat = flattenPieces();
	if (currentPieceFlat < flat.length - 1) { currentPieceFlat++; renderCurrentPiece(); }
	else closeGuidePiece();
}
function detailPrev() { if (currentPieceFlat > 0) { currentPieceFlat--; renderCurrentPiece(); } }
function closeGuidePiece() {
	showTabBar();
	openGatheringAgenda();
}

function toggleSessionMenu(e) {
	e.stopPropagation();
	const wrap = e.currentTarget.closest('.session-menu');
	const menu = wrap && wrap.querySelector('.session-menu-dropdown');
	const btn = e.currentTarget;
	if (!menu) return;
	const open = menu.hasAttribute('hidden');
	closeSessionMenu();
	if (open) {
		menu.removeAttribute('hidden');
		btn.setAttribute('aria-expanded', 'true');
		setTimeout(() => document.addEventListener('click', closeSessionMenu, { once: true }), 0);
	}
}

function closeSessionMenu() {
	document.querySelectorAll('.session-menu-dropdown').forEach(menu => menu.setAttribute('hidden', ''));
	document.querySelectorAll('.session-menu-btn').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
}

function markSessionCompleted(idx) {
	if (typeof idx === 'number') currentSessionIdx = idx;
	const session = currentSession();
	session.status = 'Completed';
	if (session.id === 1) App.prep.homeDismissed = true;
	showToast(session.title + ' marked complete.');
	const overlay = document.getElementById('connect-session-overlay');
	if (overlay && overlay.classList.contains('active')) openConnectSession(currentSessionIdx);
	else goTab('home');
}

let liveSectionIdx = 0, liveElapsedSeconds = 0, liveTimerInterval = null;

function startFacilitatorMode() {
	const session = currentSession();
	liveSectionIdx = 0;
	liveElapsedSeconds = 0;
	document.getElementById('live-session-label').textContent = `${session.title} \u00b7 Facilitator Mode`;
	renderLiveSection();
	updateLiveTimerDisplay();
	if (liveTimerInterval) clearInterval(liveTimerInterval);
	liveTimerInterval = setInterval(() => { liveElapsedSeconds++; updateLiveTimerDisplay(); }, 1000);
	hideTabBar();
	showScreen('guide-live-overlay');
}

function exitFacilitatorMode() {
	if (liveTimerInterval) { clearInterval(liveTimerInterval); liveTimerInterval = null; }
	showTabBar();
	openGatheringAgenda();
}

function liveGoSection(idx) { liveSectionIdx = idx; renderLiveSection(); }
function liveNextSection() { if (liveSectionIdx < currentSession().sections.length - 1) { liveSectionIdx++; renderLiveSection(); } }
function livePrevSection() { if (liveSectionIdx > 0) { liveSectionIdx--; renderLiveSection(); } }

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
	const countText = sec.subs.length > 1 ? ` \u00b7 ${sec.subs.length} parts` : '';
	document.getElementById('live-current-meta').textContent = `min ${sec.start}-${sec.end}${countText}`;
	document.getElementById('live-cards').innerHTML = sec.subs.map((sub, bi) => renderTabCard(sub, `live-${liveSectionIdx}-${bi}`)).join('');
	document.querySelector('#guide-live-overlay .live-prev').disabled = liveSectionIdx === 0;
	document.querySelector('#guide-live-overlay .live-next').disabled = liveSectionIdx === session.sections.length - 1;
}

function updateLiveTimerDisplay() {
	const m = Math.floor(liveElapsedSeconds / 60);
	const s = liveElapsedSeconds % 60;
	document.getElementById('live-timer').textContent = `${m}:${s.toString().padStart(2, '0')} elapsed`;
}

/* ==========================================================================
   Generic stub overlay — used for dead-end CTAs (Discernment stub, upgrade
   CTAs, Find a Circle, etc.) so we don't need a bespoke screen for each.
   ========================================================================== */
let _stubPrimaryAction = null;

function openSettings() {
	const circleRow = App.tier === 'circle'
		? profileRow('Circle', 'CIRCLE-2026', "showStub('Leave Circle', 'This demo doesn\\'t include a working leave flow.', 'Back', function(){ goTab('profile'); })")
		: profileRow('Circle', 'Not in a Circle yet', "showStub('Add a Circle', 'Enter a code from your organizer to join a Circle. This demo doesn\\'t include a working join flow yet.', 'Back', function(){ goTab('profile'); })");
	document.getElementById('settings-body').innerHTML = `
		<div class="app-header"><div class="h2">Profile</div></div>
		<p class="caption" style="margin-top:-10px;margin-bottom:8px;">Account, settings, and help.</p>
		<div class="profile-section">Account</div>
		${profileRow('Name', escapeHtml(App.firstName), "openProfilePage('name')")}
		${profileRow('Email', 'placeholder@email.com', "openProfilePage('email')")}
		${profileRow('Password', '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', "openProfilePage('password')")}
		<div class="profile-section">Settings</div>
		${profileRow('Notifications', 'Session reminders on', "openProfilePage('settings')")}
		${circleRow}
		<div class="profile-section">Help</div>
		${profileRow('FAQs', 'Common questions', "openProfilePage('faqs')")}
		${profileRow('Need Help?', 'Reach a person', "openProfilePage('help')")}
		${profileRow('AI Transparency Statement', 'How AI is used here', "openProfilePage('ai')")}
		${profileRow('Privacy', 'What stays yours', "openProfilePage('privacy')")}
		<div style="height:16px"></div>`;
	showScreen('settings');
}

function profileRow(title, sub, onclick) {
	return `<button type="button" class="profile-row" onclick="${onclick}"><span class="profile-row-text"><b>${title}</b><p class="caption">${sub}</p></span><span class="profile-chevron">&rsaquo;</span></button>`;
}

function openProfilePage(id) {
	const pages = {
		name: { title: 'Name', body: `<p class="body-text">${escapeHtml(App.firstName)} &mdash; editable later in the live app. This demo doesn&rsquo;t save a name change.</p>` },
		email: { title: 'Email', body: `<p class="body-text">placeholder@email.com</p><p class="caption">Sign-in email. Change isn&rsquo;t wired in this prototype.</p>` },
		password: { title: 'Password', body: `<p class="body-text">Password change isn&rsquo;t in this prototype.</p>` },
		settings: { title: 'Settings', body: `
			<p class="body-text">Preferences for how the app behaves for you &mdash; not content about Attune as an organization.</p>
			<div class="card outlined static" style="margin-top:12px;"><b style="font-size:15px;display:block;margin-bottom:4px;">Session reminders</b><p class="caption" style="margin:0;">On &middot; Toggle isn&rsquo;t wired in this prototype.</p></div>
			<div class="card outlined static"><b style="font-size:15px;display:block;margin-bottom:4px;">Exercise default</b><p class="caption" style="margin:0;">Training Mode until you switch it on a prompt.</p></div>` },
		faqs: { title: 'FAQs', body: `
			<div class="h3">Is what I write shared with my Circle?</div>
			<p class="body-text">No. Exercises are private unless you choose to bring something into the gathering.</p>
			<div class="h3">What&rsquo;s the difference between a personal exercise and Growth Edges?</div>
			<p class="body-text">A personal exercise is one situation. Discernment of Growth Edges looks across those situations at the season. Growth Edges is Circle-only.</p>
			<div class="h3">Does AI tell me what God is saying?</div>
			<p class="body-text">No. AI only helps roll up themes in your own words. It is not a source of guidance.</p>
			<div class="h3">Where did Explore go?</div>
			<p class="body-text">Intro content lives on Home. Session learning stays in Circle prep.</p>` },
		help: { title: 'Need Help?', body: App.tier === 'circle'
			? `<p class="body-text">Start with your facilitator if it&rsquo;s about the Circle. For the app itself, write support &mdash; this demo doesn&rsquo;t send mail.</p>
			   <div class="card outlined static"><b style="font-size:15px;display:block;margin-bottom:4px;">Your facilitator</b><p class="caption" style="margin:0;">Placeholder &middot; not a live contact.</p></div>
			   <div class="card outlined static"><b style="font-size:15px;display:block;margin-bottom:4px;">App support</b><p class="caption" style="margin:0;">support@attune.com &middot; placeholder</p></div>`
			: `<p class="body-text">For the app, write support. This demo doesn&rsquo;t send mail, and you&rsquo;re not in a Circle yet so there isn&rsquo;t a facilitator here.</p>
			   <div class="card outlined static"><b style="font-size:15px;display:block;margin-bottom:4px;">App support</b><p class="caption" style="margin:0;">support@attune.com &middot; placeholder</p></div>` },
		ai: { title: 'AI Transparency Statement', body: `
			<p class="body-text">AI is a focused pattern tool here, not a source of guidance. We use it to help roll up and name themes across your own exercises over time &mdash; a mirror for your own words, not an authority on them.</p>
			<p class="body-text">It only reads what you write in your own exercises. No content is saved to train a model or shared with anyone else, including your facilitator or group.</p>` },
		privacy: { title: 'Privacy', body: `
			<p class="body-text">What you share in a personal exercise stays private. It is not shown to a facilitator or your group unless you choose to share it in the room.</p>
			<p class="body-text">Account details (name, email) are for signing in. Circle membership is only used to connect you to that group.</p>
			<p class="caption">Full legal policy isn&rsquo;t in this prototype.</p>` }
	};
	const page = pages[id];
	if (!page) return;
	document.getElementById('settings-body').innerHTML = `
		<button class="btn-ghost back-link" onclick="openSettings()">&larr; Back</button>
		<div class="h1" style="margin-bottom:12px;">${page.title}</div>
		<div class="profile-article">${page.body}</div>
		<div style="height:16px"></div>`;
}

function showAIInfo(returnScreenId, renderFn) {
	showStub(
		'How Is AI Used?',
		"AI is a focused pattern tool here, not a source of guidance. We use it to help roll up and name themes across your own exercises over time — a mirror for your own words, not an authority on them. It only reads what you write in your own exercises; no content is saved to train a model or shared with anyone else, including your facilitator or group.",
		'Back',
		function() {
			showScreen(returnScreenId || App.currentTab);
			if (renderFn) renderFn();
		}
	);
}

function showStub(title, body, primaryLabel, primaryAction) {
	_stubPrimaryAction = primaryAction || (() => goTab(App.currentTab));
	document.getElementById('stub-overlay-body').innerHTML = `
		<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;">
			<div class="h2" style="margin-bottom:12px;">${escapeHtml(title)}</div>
			<p class="body-text" style="margin-bottom:26px;">${escapeHtml(body)}</p>
			<button class="btn btn-dark" onclick="_stubPrimaryAction()">${escapeHtml(primaryLabel || 'Back')}</button>
		</div>`;
	showScreen('stub-overlay');
}

/* -------------------------------------------------------------------------
   Coach-mark tour — paid-circle.html only (no-ops if #coach-overlay missing)
   One flow: prep card, then the four tabs.
   ------------------------------------------------------------------------- */
const COACH_STEPS = [
	{
		title: 'Get ready for Circle Community',
		body: 'This card is your prep for the gathering. Open it when you have a quiet stretch — it will walk you through getting ready, so you show up to Session 1 already oriented.',
		selector: '#home-prep-card-slot .home-prep-stack',
		pill: false
	},
	{
		title: 'Home',
		body: 'Home is your dashboard — prep for the gathering, plus intro content you can return to anytime. Session-specific learning stays in Circle prep.',
		selector: '.tab-item[data-tab="home"]',
		pill: true
	},
	{
		title: 'Exercises',
		body: 'Come here anytime you want to do a personal exercise — on your own. As you go, this is also where you can watch your patterns grow, and look back at recaps.',
		selector: '.tab-item[data-tab="exercise"]',
		pill: true
	},
	{
		title: 'Circle',
		body: 'Circle is sessions, prep, and facilitating. Prepare on your own, then open the gathering when you are in the room — those two do not run together. Facilitator Mode lives with the agenda, not as the main action.',
		selector: '.tab-item[data-tab="connect"]',
		pill: true
	},
	{
		title: 'Profile',
		body: 'Account, settings, and the rest of the manage-your-stuff list live here — not a tab about the organization.',
		selector: '.tab-item[data-tab="profile"]',
		pill: true
	}
];

let _coach = null;

function startCoachTour() {
	if (!document.getElementById('coach-overlay')) return;
	if (_coach) endCoachTour();
	const begin = () => {
		if (!document.querySelector('#home-prep-card-slot .home-prep-stack')) return;
		const overlay = document.getElementById('coach-overlay');
		const rail = document.getElementById('coach-rail');
		rail.classList.add('no-swipe');
		rail.onscroll = null;
		_coach = { step: 0, total: COACH_STEPS.length, steps: COACH_STEPS };
		overlay.classList.add('open');
		overlay.setAttribute('aria-hidden', 'false');
		renderCoachStep();
	};
	const homeOn = document.getElementById('home');
	if (!homeOn || !homeOn.classList.contains('active')) {
		goTab('home');
		requestAnimationFrame(() => requestAnimationFrame(begin));
		return;
	}
	begin();
}

function maybeCoachFab() {
	if (App.fabCoached || _coach) return;
	if (!document.getElementById('coach-overlay')) { App.fabCoached = true; return; }
	if (App.currentTab !== 'exercise') return;
	const fab = document.getElementById('ex-fab');
	if (!fab || !fab.classList.contains('visible')) return;
	const overlay = document.getElementById('coach-overlay');
	const rail = document.getElementById('coach-rail');
	if (!overlay || !rail) return;
	rail.classList.add('no-swipe');
	rail.onscroll = null;
	_coach = {
		step: 0,
		total: 1,
		onEnd: function() { App.fabCoached = true; },
		steps: [{
			title: 'Do an exercise anytime',
			body: 'Tap + whenever you want to start. It stays here so you can always find it.',
			selector: '#ex-fab',
			pill: false
		}]
	};
	overlay.classList.add('open');
	overlay.setAttribute('aria-hidden', 'false');
	renderCoachStep();
}

function renderCoachStep() {
	if (!_coach) return;
	const steps = _coach.steps || COACH_STEPS;
	const step = steps[_coach.step];
	document.getElementById('coach-rail').innerHTML = `
		<div class="coach-page">
			<div class="h3">${escapeHtml(step.title)}</div>
			<p class="body-text">${escapeHtml(step.body)}</p>
		</div>`;
	updateCoachChrome();
	requestAnimationFrame(() => {
		positionCoachTarget(document.querySelector(step.selector), step.pill);
	});
}

function updateCoachChrome() {
	if (!_coach) return;
	document.getElementById('coach-page').textContent = `${_coach.step + 1}/${_coach.total}`;
	const nextBtn = document.querySelector('#coach-overlay .btn-small');
	if (nextBtn) nextBtn.textContent = _coach.step === _coach.total - 1 ? 'Got it' : 'Next';
}

function positionCoachTarget(target, pill) {
	const overlay = document.getElementById('coach-overlay');
	const hole = document.getElementById('coach-hole');
	const bubble = document.getElementById('coach-bubble');
	if (!overlay || !hole || !bubble || !target) return;
	const frame = overlay.getBoundingClientRect();
	const tr = target.getBoundingClientRect();
	const pad = pill ? 6 : 8;
	hole.classList.toggle('pill', !!pill);
	hole.style.left = (tr.left - frame.left - pad) + 'px';
	hole.style.top = (tr.top - frame.top - pad) + 'px';
	hole.style.width = (tr.width + pad * 2) + 'px';
	hole.style.height = (tr.height + pad * 2) + 'px';
	const holeTop = tr.top - frame.top - pad;
	const holeBottom = holeTop + tr.height + pad * 2;
	bubble.style.top = '0px';
	const bubbleH = bubble.offsetHeight;
	const spaceBelow = frame.height - holeBottom - 16;
	let top;
	if (pill || spaceBelow < bubbleH + 12) {
		top = holeTop - bubbleH - 12;
		if (top < 12) top = Math.min(holeBottom + 12, frame.height - bubbleH - 12);
	} else {
		top = holeBottom + 12;
	}
	bubble.style.top = Math.max(12, top) + 'px';
}

function nextCoachTour() {
	if (!_coach) return;
	if (_coach.step >= _coach.total - 1) {
		endCoachTour();
		return;
	}
	_coach.step += 1;
	renderCoachStep();
}

function skipCoachTour() {
	endCoachTour();
}

function endCoachTour() {
	const onEnd = _coach && _coach.onEnd;
	const overlay = document.getElementById('coach-overlay');
	const rail = document.getElementById('coach-rail');
	if (rail) rail.onscroll = null;
	_coach = null;
	if (overlay) {
		overlay.classList.remove('open');
		overlay.setAttribute('aria-hidden', 'true');
	}
	if (onEnd) onEnd();
}
