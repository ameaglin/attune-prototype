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
	prep: { classroom: false, exercise: false, reflect: false, dge: false, homeDismissed: false },
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
			{ theme: 'trust', text: "I do not have to redeem the whole evening in one hour.", date: 'Aug 14', day: '2026-08-14' },
			{ theme: 'presence', text: "They still come find me. I want to be in the room when they do.", date: 'Jul 18', day: '2026-07-18' }
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
			{ theme: 'trust', text: "Leaving it open another week felt like the risk.", date: 'Aug 16', day: '2026-08-16' },
			{ theme: 'courage', text: "Ask one more question before I offer a plan.", date: 'Jul 8', day: '2026-07-08' }
		] }
];

function applyExerciseDemoFromQuery() {
	const params = new URLSearchParams(location.search);
	const ex = params.get('ex');
	App.dgeUnlocked = false;
	App.fabCoached = true;
	if (ex === 'empty') {
		App.exercises = []; App.dgeDone = false; App.lastDgeDay = null; App.dgeUnlocked = false; App.fabCoached = false; App.prep.dge = false;
	} else if (ex === 'few') {
		App.exercises = SEED_KRLS.slice(0, 2); App.dgeDone = false; App.lastDgeDay = null;
	} else if (ex === 'ready') {
		App.exercises = SEED_KRLS.slice(0, 4); App.dgeDone = false; App.lastDgeDay = null;
	} else if (ex === 's4') {
		App.exercises = SEED_KRLS.slice(0, 4); App.dgeDone = false; App.lastDgeDay = null; App.dgeUnlocked = true; App.prep.dge = false;
		currentSessionIdx = 3;
	} else if (ex === 'after') {
		App.exercises = SEED_KRLS.slice(0, 4); App.dgeDone = true; App.lastDgeDay = '2026-08-10'; App.dgeUnlocked = true; App.prep.dge = true;
		currentSessionIdx = 3;
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
	else if (_obPath === 'find' || _obPath === 'explore') showScreen('ob-find-circle');
	else if (typeof onPersonalPractice === 'function') onPersonalPractice();
}

function toggleObGuide(id) {
	document.querySelectorAll('.ob-acc').forEach(el => {
		if (el.dataset.obAcc !== id) return;
		const open = el.classList.toggle('open');
		const btn = el.querySelector('.ob-acc-head');
		if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
	});
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
				${glyphIcon('speak')}<span class="triad-btn-label">Talk</span>
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

const PIGMENTS = ['teal', 'mulberry', 'ochre', 'pine', 'rust', 'olive'];
function patternPigment(patternId, index) {
	return PIGMENTS[index % PIGMENTS.length];
}

const PATTERN_META = {
	trust:    { label: 'Trust & Surrender', icon: '&#9680;', hue: 'teal' },
	patience: { label: 'Patience', icon: '&#8998;', hue: 'olive' },
	clarity:  { label: 'Clarity', icon: '&#9678;', hue: 'mulberry' },
	presence: { label: 'Presence', icon: '&#9673;', hue: 'ochre' },
	courage:  { label: 'Courage', icon: '&#9671;', hue: 'pine' }
};
const PATTERN_ORDER = ['trust', 'patience', 'clarity', 'presence', 'courage'];

function patternHue(themeKey, index) {
	const meta = PATTERN_META[themeKey];
	if (meta && meta.hue) return meta.hue;
	return patternPigment(themeKey, typeof index === 'number' ? index : 0);
}

const ex = { mode: 'training', introAudio: false, warmupAudio: true, warmupWords: false, warmupPlaying: false, stepIdx: 0, responses: [], recap: null, returnTab: 'exercise', fromPrep: false, rating: 0 };

function startExercise(opts) {
	ex.mode = 'training';
	ex.introAudio = false;
	ex.warmupAudio = true;
	ex.warmupWords = false;
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
		<div class="flow-head">
			<div class="flow-head-row">
				<div>
					<div class="h3" style="color:var(--canvas);margin:0;">Personal exercise</div>
					<div class="kicker" style="color:rgba(251,249,246,0.82);margin:6px 0 0;">Before you begin</div>
				</div>
				<button class="btn-ghost flow-head-x" onclick="cancelExercise()">&#10005;</button>
			</div>
		</div>
		<div class="h2" style="margin-bottom:12px;">One situation, about twenty minutes.</div>
		<button type="button" class="btn btn-light" style="margin-bottom:16px;" onclick="toggleIntroAudio()">${listening ? 'Playing intro' : 'Listen to intro'}</button>
		${listening ? `<div class="card static" style="text-align:center;padding:20px;margin-bottom:16px;">
			<div class="triad-waveform" style="justify-content:center;">${Array.from({ length: 7 }).map((_, i) => `<span class="triad-wave-bar" style="height:${12 + (i * 4) % 22}px;animation-delay:${(i * 0.1).toFixed(1)}s"></span>`).join('')}</div>
			<p class="caption">[ Playing intro &middot; ~1 min ]</p>
		</div>` : ''}
		<p class="body-text" style="margin-bottom:12px;">You&rsquo;ll settle for a few minutes, then move through a set of prompts about one situation you&rsquo;re carrying. There are no right answers and nothing to finish quickly.</p>
		<p class="body-text" style="margin-bottom:12px;font-weight:600;">Take the full time. The pauses are the practice.</p>
		<p class="caption" style="margin-bottom:8px;">Everything you write stays private to you. You decide what you bring to your Circle.</p>
		<p class="caption" style="margin-bottom:20px;"><a href="javascript:void(0)" onclick="showAIInfo('exercise-overlay', renderExercisePrivacy)" style="color:inherit;text-decoration:underline;">How is AI used?</a></p>
		<button class="btn btn-dark btn-block-mt" onclick="renderExerciseWarmup()">Start the exercise</button>
		<button class="btn-ghost" style="margin-top:14px;align-self:center;" onclick="renderExerciseWarmup()">Don&rsquo;t show this again</button>`);
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

function sitChromeHTML(opts) {
	const total = opts.total || (EXERCISE_STEPS.length + 2);
	const step = opts.step || 1;
	const back = opts.backOnclick
		? `<button class="btn-ghost" onclick="${opts.backOnclick}">&larr; Back</button>`
		: `<button class="btn-ghost" onclick="${opts.exitOnclick || 'cancelExercise()'}">&#10005; Exit</button>`;
	const save = `<button class="btn-ghost" onclick="${opts.saveOnclick || 'cancelExercise()'}">Save</button>`;
	return `
		<div class="sit-chrome">
			<div class="sit-chrome-nav">${back}${save}</div>
			<div class="sit-chrome-row">
				<span class="sit-chrome-title">${opts.title}</span>
				<span class="sit-chrome-step">Step ${step} of ${total}</span>
			</div>
			<div class="pace-track sit-pace"><div class="pace-fill" style="width:${(step / total) * 100}%"></div></div>
		</div>`;
}

function exerciseBeatLabel(idx) {
	if (idx === 0) return 'Name';
	if (idx <= 2) return 'Listen \u00b7 Self';
	if (idx <= 5) return 'Listen \u00b7 Other';
	if (idx <= 8) return 'Listen \u00b7 Circumstance';
	return 'Discern';
}

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
	const sub = opts.sub ? `<p class="think-sub">${opts.sub}</p>` : '';
	const extra = opts.extra || '';
	const skip = opts.showSkip
		? (opts.readyLabel
			? `<div class="think-ready-row">${sitSkipButtonHTML(opts.skipOnclick)}<span class="think-ready-label">${opts.readyLabel}</span></div>`
			: sitSkipButtonHTML(opts.skipOnclick))
		: '';
	return `
		<div class="sit-fade" id="sit-fade"></div>
		<div class="sit-stage-inner">
			${kicker}
			<div class="sit-orb" aria-hidden="true"></div>
			${title}
			${sub}
			<div class="think-foot">
				<div class="think-breathe" id="think-breathe">Breathe in</div>
				${skip}
			</div>
			${extra}
		</div>`;
}

function setSitImmersive(on, hue) {
	const el = document.getElementById('exercise-overlay');
	if (!el) return;
	el.classList.toggle('sit-immersive', !!on);
	el.classList.toggle('pig-iris', hue === 'iris');
	if (!on) {
		el.classList.remove('sit-light');
		el.classList.remove('pig-iris');
	}
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
	const fill = document.getElementById('think-ring-fill');
	if (fill) fill.style.strokeDashoffset = '0';
	const b = document.getElementById('think-breathe');
	if (b) b.textContent = 'Whenever you\u2019re ready';
}

function startSitTimer(durationMs) {
	clearSitTimers();
	_sitDone = false;
	const c = sitRingCircumference();
	const fill = document.getElementById('think-ring-fill');
	const started = Date.now();
	function tick() {
		if (_sitDone) return;
		const p = Math.min(1, (Date.now() - started) / durationMs);
		if (fill) fill.style.strokeDashoffset = String(c * (1 - p));
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
	if (which === 'audio') { ex.warmupAudio = true; ex.warmupWords = false; }
	else { ex.warmupWords = true; ex.warmupAudio = false; }
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
	setSitImmersive(true);
	const extra = playing
		? `<div id="warmup-audio-slot"></div><div id="warmup-words-slot"></div>`
		: `<button type="button" class="sit-play" onclick="startWarmupPlay()" aria-label="Start warm-up"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg></button>`;
	exOverlay(`
		<div class="sit-full-wrap">
			${sitChromeHTML({ title: 'Warm-up', step: 1 })}
			<div class="sit-stage sit-stage--full${playing ? '' : ' is-idle'}">
				${sitStageInnerHTML({
					title: playing ? '' : 'A few minutes to settle before you begin.',
					showSkip: playing,
					skipOnclick: 'skipSit()',
					extra
				})}
			</div>
			<div class="warmup-toggles">
				<button type="button" class="warmup-toggle${ex.warmupAudio ? ' active' : ''}" data-warmup-toggle="audio" onclick="toggleWarmupFlag('audio')">Listen</button>
				<button type="button" class="warmup-toggle${ex.warmupWords ? ' active' : ''}" data-warmup-toggle="words" onclick="toggleWarmupFlag('words')">Read</button>
			</div>
			${playing ? `<div class="sit-actions"><button class="btn btn-sit-outline" onclick="renderExerciseStep(0)">I&rsquo;m ready</button></div>` : ''}
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
	setSitImmersive(true);
	ex.stepIdx = idx;
	const step = EXERCISE_STEPS[idx];
	const isLast = idx === EXERCISE_STEPS.length - 1;
	const back = idx === 0 ? "renderExerciseWarmup()" : `renderExerciseStep(${idx - 1})`;
	exOverlay(`
		<div class="sit-full-wrap">
			${sitChromeHTML({ title: exerciseBeatLabel(idx), step: idx + 2, backOnclick: back })}
			<div class="sit-stage sit-stage--full">
				${sitStageInnerHTML({
					title: escapeHtml(step.prompt),
					showSkip: true,
					skipOnclick: `exerciseNext(${idx}, ${isLast})`
				})}
			</div>
			<div class="sit-prompt-input">
				${renderInputTriadHTML('triad-current')}
			</div>
		</div>`);
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
	const total = EXERCISE_STEPS.length + 2;
	return `
		<div class="recap-hero">
			<div class="sit-chrome-row" style="margin-bottom:14px;">
				<span class="sit-chrome-title">Recap</span>
				<span class="sit-chrome-step">Step ${total} of ${total}</span>
			</div>
			<div class="h1">Here&rsquo;s what you said.</div>
			<p class="caption">${edit
				? 'Change anything that isn&rsquo;t quite right \u2014 these are your words, not ours.'
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
		const title = themes.length ? themes.map(t => PATTERN_META[t].label).join(', ') : '';
		if (themes.length === 1) {
			const hue = patternHue(themes[0]);
			cells.push(`<span class="pcal-cell" style="background:var(--pig-${hue})" title="${title}"></span>`);
		} else if (themes.length > 1) {
			cells.push(`<span class="pcal-cell mix" title="${title}"></span>`);
		} else {
			cells.push(`<span class="pcal-cell" title="${title}"></span>`);
		}
	}
	return `
	<div class="pcal-card">
		<div class="pcal-kicker">You've Been Noticing</div>
		<div class="pcal-month">${monthName}</div>
		<div class="pcal-dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
		<div class="pcal-grid">${cells.join('')}</div>
		<div class="pcal-legend">
			${PATTERN_ORDER.slice(0, 3).map(t => `<span><i class="pcal-cell" style="background:var(--pig-${patternHue(t)})"></i>${PATTERN_META[t].label}</span>`).join('')}
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
	const btn = variant === 'soft' ? 'btn-dark' : 'btn-on-pigment';
	return `
	<div class="${cls}" onclick="startExercise({returnTab:'exercise'})">
		<div class="kicker">On your own</div>
		<div class="h3">Do a personal exercise</div>
		<p class="caption" style="margin:6px 0 16px;">One situation — warm-up, Listen, Discern, Go. About 10–12 prompts, on your own.</p>
		<button class="btn ${btn} btn-small" onclick="event.stopPropagation();startExercise({returnTab:'exercise'})">Start</button>
	</div>`;
}

function dgeCardHTML(again) {
	return `
	<div class="${again ? 'card outlined static' : 'hero-card pig-iris'}" ${again ? '' : 'onclick="startDGE()"'}>
		<div class="kicker">Circle \u00b7 The season</div>
		<div class="h3">${again ? 'Update growth edges' : 'Discernment of Growth Edges'}</div>
		<p class="caption" style="margin:6px 0 16px;">${again ? 'Look across the season again \u2014 roughly quarterly.' : 'A second exercise \u2014 same three movements, object is the season. Looks across your past exercises; it does not create the patterns.'}</p>
		<button class="btn ${again ? 'btn-light' : 'btn-on-pigment'} btn-small" onclick="event.stopPropagation();startDGE()">${again ? 'Discern again' : 'Begin'}</button>
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
		? gos.map(t => `<p class="ge-go-line">${escapeHtml(t)}</p>`).join('')
		: '';
	return `
	<div class="hero-card pig-iris static ge-card">
		<div class="kicker">This season's growth edges</div>
		<div class="ge-chips">${edgeChips}</div>
		${goChips ? `<div class="ge-label">Go steps</div>${goChips}` : ''}
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

function startDGE(opts) {
	dge.range = 'since';
	dge.fromEdit = false;
	dge.fromPrep = !!(opts && opts.fromPrep);
	dge.edges = ['', '', ''];
	dge.go = '';
	dge.focus = 0;
	dge.resonate = '';
	dge.elseGod = '';
	dge.customPatterns = [];
	dge.addingPattern = false;
	dge.openTheme = null;
	dge.themeIdx = 0;
	dge.warmupPlaying = false;
	dge.warmupAudio = true;
	dge.warmupWords = false;
	dge.customStart = dge.customStart || '2026-08-01';
	dge.customEnd = dge.customEnd || '2026-08-26';
	hideTabBar();
	showScreen('exercise-overlay');
	renderDgeIntro();
}

const dge = {
	range: 'since', edges: ['', '', ''], go: '', focus: 0, fromEdit: false, fromPrep: false,
	customStart: '2026-08-01', customEnd: '2026-08-26',
	resonate: '', elseGod: '', customPatterns: [], addingPattern: false, openTheme: null,
	warmupPlaying: false, warmupAudio: true, warmupWords: false, themeIdx: 0
};

function cancelDGE() {
	clearSitTimers();
	setSitImmersive(false);
	if (dge.fromPrep) {
		showTabBar();
		showScreen('prep-overlay');
		prepShowChecklist();
		return;
	}
	showTabBar();
	goTab('exercise');
}

function renderDgeIntro() {
	clearSitTimers();
	setSitImmersive(false);
	const stats = dgeIntroStats();
	const count = stats.n === 1 ? 'one exercise' : `${stats.n} exercises`;
	exOverlay(`
		${dgeFlowChromeHTML({ intro: true, title: 'Growth Edges', kicker: 'Session 4 \u00b7 Once a season' })}
		<div class="h1" style="margin-bottom:14px;">This one looks across the season, not at one situation.</div>
		<p class="body-text" style="margin-bottom:14px;">You&rsquo;ve done ${count} since ${escapeHtml(stats.since)}. This exercise gathers what kept coming up in them, and then asks you &mdash; not the app &mdash; to name where you&rsquo;re being invited to grow.</p>
		<p class="body-text" style="margin-bottom:14px;">About thirty minutes. This is the exercise for Session 4.</p>
		<p class="caption" style="margin-bottom:8px;">The themes are a starting point, not an answer. Everything here stays private to you.</p>
		<p class="caption" style="margin-bottom:24px;"><a href="javascript:void(0)" onclick="showAIInfo('exercise-overlay', renderDgeIntro)" style="color:inherit;text-decoration:underline;">How is AI used?</a></p>
		<button class="btn btn-dark btn-block-mt" onclick="renderDgeRange()">Begin</button>
		<div style="height:16px"></div>`);
}

function paintDgeWarmupSlots() {
	const audioSlot = document.getElementById('warmup-audio-slot');
	const wordsSlot = document.getElementById('warmup-words-slot');
	if (audioSlot) audioSlot.innerHTML = (dge.warmupPlaying && dge.warmupAudio) ? warmupAudioHTML() : '';
	if (wordsSlot) wordsSlot.innerHTML = (dge.warmupPlaying && dge.warmupWords) ? `<p class="body-text sit-words">${WARMUP_WORDS}</p>` : '';
}

function toggleDgeWarmupFlag(which) {
	if (which === 'audio') { dge.warmupAudio = true; dge.warmupWords = false; }
	else { dge.warmupWords = true; dge.warmupAudio = false; }
	document.querySelectorAll('[data-dge-warmup]').forEach(btn => {
		const on = btn.dataset.dgeWarmup === 'audio' ? dge.warmupAudio : dge.warmupWords;
		btn.classList.toggle('active', on);
	});
	paintDgeWarmupSlots();
}

function startDgeWarmupPlay() {
	dge.warmupPlaying = true;
	renderDgeWarmup();
}

function renderDgeWarmup() {
	const playing = !!dge.warmupPlaying;
	if (!playing) clearSitTimers();
	setSitImmersive(true, 'iris');
	const extra = playing
		? `<div id="warmup-audio-slot"></div><div id="warmup-words-slot"></div>`
		: `<button type="button" class="sit-play" onclick="startDgeWarmupPlay()" aria-label="Start warm-up"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg></button>`;
	exOverlay(`
		<div class="sit-full-wrap">
			${dgeSitChromeHTML('Warm-up', 2)}
			<div class="sit-stage sit-stage--full pig-iris${playing ? '' : ' is-idle'}">
				${sitStageInnerHTML({
					title: playing ? '' : 'A few minutes to settle before you look back.',
					extra
				})}
			</div>
			<div class="warmup-toggles">
				<button type="button" class="warmup-toggle${dge.warmupAudio ? ' active' : ''}" data-dge-warmup="audio" onclick="toggleDgeWarmupFlag('audio')">Listen</button>
				<button type="button" class="warmup-toggle${dge.warmupWords ? ' active' : ''}" data-dge-warmup="words" onclick="toggleDgeWarmupFlag('words')">Read</button>
			</div>
			<div class="sit-actions"><button class="btn btn-sit-outline" onclick="renderDgeThemes()">I&rsquo;m ready</button></div>
		</div>`);
	if (playing) {
		paintDgeWarmupSlots();
		startSitTimer(WARMUP_MS);
	}
}

function dgeLastLabel() {
	const n = (App.exercises || []).length;
	const count = n === 1 ? '1 exercise' : `${n} exercises`;
	if (!App.lastDgeDay) return `${count} \u00b7 this season. You haven\u2019t named growth edges before.`;
	const [y, m, d] = App.lastDgeDay.split('-');
	const label = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	return `${count} \u00b7 since ${label}.`;
}

function renderDgeRange() {
	clearSitTimers();
	setSitImmersive(false);
	const sinceOn = dge.range === 'since';
	const customOn = dge.range === 'custom';
	exOverlay(`
		${dgeFlowChromeHTML({ title: 'Which exercises', step: 1 })}
		<div class="h1" style="margin-bottom:8px;">How far back should we look?</div>
		<p class="caption" style="margin-bottom:16px;">This only decides which past exercises are included.</p>
		<div class="dge-range">
		<button type="button" class="path-option${sinceOn ? ' selected' : ''}" data-dge-range="since" onclick="selectDgeRange('since')">
			<span class="path-radio"></span>
			<span><div class="h3">Everything so far</div><p class="caption">${escapeHtml(dgeLastLabel())}</p></span>
		</button>
		<button type="button" class="path-option${customOn ? ' selected' : ''}" data-dge-range="custom" onclick="selectDgeRange('custom')">
			<span class="path-radio"></span>
			<span><div class="h3">Choose the months</div><p class="caption">Set a start and an end yourself.</p></span>
		</button>
		</div>
		${customOn ? `
		<div class="dge-dates">
			<label class="ge-label">Start</label>
			<input type="date" class="input-box" value="${escapeHtml(dge.customStart)}" oninput="dge.customStart=this.value">
			<label class="ge-label">End</label>
			<input type="date" class="input-box" value="${escapeHtml(dge.customEnd)}" oninput="dge.customEnd=this.value">
		</div>` : ''}
		<button class="btn btn-dark btn-block-mt" onclick="renderDgeWarmup()">Continue</button>
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
	const rolled = PATTERN_ORDER.filter(t => byTheme[t] && byTheme[t].length).map(theme => ({
		theme,
		meta: PATTERN_META[theme],
		quotes: byTheme[theme],
		custom: false
	}));
	const custom = (dge.customPatterns || []).map(p => ({
		theme: p.id,
		meta: { label: p.label, icon: '+' },
		quotes: p.quotes || [],
		custom: true
	}));
	return rolled.concat(custom).slice(0, 8);
}

function dgeThemeSize(count, max) {
	const ratio = count / (max || 1);
	if (ratio >= 0.75) return 'size-l';
	if (ratio >= 0.4) return 'size-m';
	return 'size-s';
}

function renderDgeGather() {
	clearSitTimers();
	setSitImmersive(true, 'iris');
	exOverlay(`
		<div class="sit-full-wrap">
			<div class="sit-topbar" style="display:flex;justify-content:space-between;align-items:center;">
				<button class="btn-ghost" onclick="cancelDGE()">&#10005; Exit</button>
				<button class="btn-ghost" onclick="cancelDGE()">Save</button>
			</div>
			<div class="sit-stage sit-stage--full pig-iris">
				${sitStageInnerHTML({
					kicker: 'A pause',
					title: 'Looking across your situations',
					showSkip: true,
					skipOnclick: 'renderDgeThemes()'
				})}
			</div>
		</div>`);
	startSitTimer(WARMUP_MS);
}

function dgeFlowChromeHTML(opts) {
	opts = opts || {};
	const title = opts.title || '';
	const step = opts.step;
	const total = opts.total || 7;
	if (opts.intro) {
		return `
		<div class="dge-flow-head dge-intro-band">
			<div class="flow-head-row">
				<div>
					<div class="h2" style="color:var(--canvas);margin:0;">${title}</div>
					${opts.kicker ? `<div class="kicker" style="color:rgba(251,249,246,0.82);margin:8px 0 0;">${opts.kicker}</div>` : ''}
				</div>
				<button class="btn-ghost flow-head-x" onclick="cancelDGE()">&#10005;</button>
			</div>
		</div>`;
	}
	return `
		<div class="dge-flow-head">
			<div class="sit-chrome-row">
				<span class="sit-chrome-title">${title}</span>
				<span class="sit-chrome-step">Step ${step} of ${total}</span>
			</div>
			<div class="pace-track sit-pace"><div class="pace-fill" style="width:${(step / total) * 100}%"></div></div>
		</div>`;
}

function dgeSitChromeHTML(title, step, total) {
	total = total || 7;
	return `
		<div class="sit-chrome">
			<div class="sit-chrome-nav">
				<span></span>
				<button class="btn-ghost" onclick="cancelDGE()">&#10005;</button>
			</div>
			<div class="sit-chrome-row">
				<span class="sit-chrome-title">${title}</span>
				<span class="sit-chrome-step">Step ${step} of ${total}</span>
			</div>
			<div class="pace-track sit-pace"><div class="pace-fill" style="width:${(step / total) * 100}%"></div></div>
		</div>`;
}

function dgeIntroStats() {
	const n = (App.exercises || []).length;
	const days = (App.exercises || []).map(exerciseDayKey).filter(Boolean).sort();
	let since = 'this season';
	if (days[0]) {
		const [y, m, d] = days[0].split('-');
		since = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { month: 'long' });
	}
	return { n, since };
}

function patternIsThisMonth(quotes) {
	const now = new Date();
	const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	return (quotes || []).some(q => (quoteDayKey(q) || '').startsWith(monthPrefix));
}

function renderDgeThemes() {
	clearSitTimers();
	setSitImmersive(false);
	const groups = dgeThemeGroups();
	if (!groups.length) {
		exOverlay(`
			${dgeFlowChromeHTML({ title: 'Patterns', step: 3 })}
			<div class="h1" style="margin-bottom:6px;">What keeps showing up</div>
			<p class="caption">Not enough in this range yet. Try a wider window.</p>
			<button class="btn btn-dark btn-block-mt" onclick="renderDgeListen()">Continue</button>
			<div style="height:16px"></div>`);
		return;
	}
	if (typeof dge.themeIdx !== 'number' || dge.themeIdx < 0) dge.themeIdx = 0;
	if (dge.themeIdx >= groups.length) dge.themeIdx = groups.length - 1;
	const cards = groups.map((g, i) => {
		const hue = patternHue(g.theme, i);
		const n = (g.quotes || []).length;
		const thisMonth = patternIsThisMonth(g.quotes);
		const fill = thisMonth ? `var(--pig-${hue})` : `var(--pig-${hue}-tint)`;
		const color = thisMonth ? 'var(--canvas)' : `var(--pig-${hue}-ink)`;
		const kicker = g.custom ? 'You added' : (n ? `In ${n} situation${n === 1 ? '' : 's'}` : 'In your words');
		const quotes = (g.quotes || []).slice(0, 2);
		const snippets = quotes.length
			? quotes.map(q => `<div class="pattern-quote">\u201C${escapeHtml(q.text)}\u201D</div>`).join('')
			: `<p class="caption">You added this. It did not come from an exercise.</p>`;
		const see = n
			? `<button type="button" class="dge-theme-see" onclick="renderDgeThemeDetail('${g.theme}')">See all ${n} \u203a</button>`
			: '';
		return `<article class="dge-theme${thisMonth ? '' : ' is-tint'}" data-theme="${g.theme}" style="background:${fill};color:${color}">
			<div class="kicker">${kicker}</div>
			<div class="h3">${escapeHtml(g.meta.label)}</div>
			${snippets}
			${see}
		</article>`;
	}).join('');
	const dots = groups.map((g, i) => {
		const hue = patternHue(g.theme, i);
		const thisMonth = patternIsThisMonth(g.quotes);
		const fill = thisMonth ? `var(--pig-${hue})` : `var(--pig-${hue}-tint)`;
		return `<button type="button" class="dge-dot${i === dge.themeIdx ? ' on' : ''}" style="background:${fill}" aria-label="Pattern ${i + 1}" onclick="dgeScrollToTheme(${i})"></button>`;
	}).join('');
	exOverlay(`
		${dgeFlowChromeHTML({ title: 'Patterns', step: 3 })}
		<div class="h1" style="margin-bottom:8px;">What keeps showing up</div>
		<p class="caption" style="margin-bottom:16px;">Scroll the cards and sit with them. These are starting points \u2014 not your growth edges yet.</p>
		<div class="dge-rail" id="dge-rail">${cards}</div>
		<div class="dge-dots" id="dge-dots">${dots}</div>
		<button class="btn btn-dark btn-block-mt" onclick="renderDgeListen()">Continue</button>
		<div style="height:16px"></div>`);
	bindDgeRail();
}

function dgeRailPad() {
	const rail = document.getElementById('dge-rail');
	if (!rail) return 0;
	return parseFloat(getComputedStyle(rail).paddingLeft) || 0;
}

function bindDgeRail() {
	const rail = document.getElementById('dge-rail');
	if (!rail) return;
	const cards = [...rail.querySelectorAll('.dge-theme')];
	function syncDots() {
		if (!cards.length) return;
		const gap = 12;
		const w = cards[0].offsetWidth + gap;
		const idx = Math.max(0, Math.min(cards.length - 1, Math.round(rail.scrollLeft / w)));
		dge.themeIdx = idx;
		document.querySelectorAll('#dge-dots .dge-dot').forEach((d, i) => d.classList.toggle('on', i === idx));
	}
	rail.addEventListener('scroll', syncDots, { passive: true });
	if (dge.themeIdx) dgeScrollToTheme(dge.themeIdx, true);
}

function dgeScrollToTheme(idx, instant) {
	const rail = document.getElementById('dge-rail');
	if (!rail) return;
	const card = rail.querySelectorAll('.dge-theme')[idx];
	if (!card) return;
	dge.themeIdx = idx;
	rail.scrollTo({ left: Math.max(0, card.offsetLeft - dgeRailPad()), behavior: instant ? 'auto' : 'smooth' });
	document.querySelectorAll('#dge-dots .dge-dot').forEach((d, i) => d.classList.toggle('on', i === idx));
}

function dgeNextTheme() { dgeScrollToTheme((dge.themeIdx || 0) + 1); }
function dgePrevTheme() { dgeScrollToTheme(Math.max(0, (dge.themeIdx || 0) - 1)); }

function openDgeTheme(theme) {
	renderDgeThemeDetail(theme);
}

function renderDgeThemeDetail(theme) {
	clearSitTimers();
	setSitImmersive(false);
	const groups = dgeThemeGroups();
	const g = groups.find(x => x.theme === theme) || groups[dge.themeIdx] || groups[0];
	if (!g) { renderDgeThemes(); return; }
	dge.openTheme = g.theme;
	dge.themeIdx = Math.max(0, groups.findIndex(x => x.theme === g.theme));
	const hue = patternHue(g.theme, dge.themeIdx);
	const all = g.quotes || [];
	const shown = all.slice(0, 3);
	const n = all.length;
	const quotes = shown.map(q => `
		<div class="pattern-quote" style="border-left-color:var(--pig-${hue})">
			\u201C${escapeHtml(q.text)}\u201D
			<span class="pattern-quote-date">${escapeHtml(q.date || '')}${q.situation ? ' \u00b7 ' + escapeHtml(q.situation) : ''}</span>
		</div>`).join('');
	const kicker = g.custom ? 'You added' : (n ? `In ${n} exercise${n === 1 ? '' : 's'} \u00b7 this month` : 'In your words');
	exOverlay(`
		<div class="dge-detail-head" style="background:var(--pig-${hue})">
			<div class="sit-chrome-nav">
				<button class="btn-ghost" onclick="renderDgeThemes()">&larr; Back</button>
				<button class="btn-ghost" onclick="cancelDGE()">Save</button>
			</div>
			<div class="kicker">${kicker}</div>
			<div class="h2">${escapeHtml(g.meta.label)}</div>
		</div>
		<p class="caption" style="margin-bottom:14px;">Your words, unedited.</p>
		${quotes || '<p class="caption">You added this. It did not come from an exercise.</p>'}
		<div class="dge-detail-foot">${shown.length} of ${n} shown</div>`);
}

function addDgePattern() {
	const el = document.getElementById('dge-add-pattern');
	const label = el && el.value.trim();
	if (!label) return;
	dge.customPatterns.push({ id: 'custom-' + (dge.customPatterns.length + 1), label, quotes: [] });
	dge.addingPattern = false;
	renderDgeThemes();
}

function captureDgeListen() {
	const r = document.getElementById('dge-resonate');
	const e = document.getElementById('dge-else');
	if (r) dge.resonate = r.value;
	if (e) dge.elseGod = e.value;
	const fromTriad = triadGetValue('triad-current');
	if (fromTriad) dge.elseGod = fromTriad;
}

function renderDgeListen() {
	clearSitTimers();
	setSitImmersive(true, 'iris');
	exOverlay(`
		<div class="sit-full-wrap">
			${dgeSitChromeHTML('Listen', 4)}
			<div class="sit-stage sit-stage--full pig-iris">
				${sitStageInnerHTML({
					title: 'What of that is God still asking you to look at?',
					sub: 'And anything He&rsquo;s been showing you that never made it into an exercise.',
					showSkip: true,
					skipOnclick: 'captureDgeListen();renderDgeEdges()',
					readyLabel: 'I&rsquo;m ready'
				})}
			</div>
			<div class="sit-prompt-input">
				${renderInputTriadHTML('triad-current')}
			</div>
		</div>`);
	startSitTimer(THINK_MS);
}

function renderDgeEdges() {
	clearSitTimers();
	setSitImmersive(false);
	const thirdEmpty = !String(dge.edges[2] || '').trim();
	exOverlay(`
		${dge.fromEdit
			? `<button class="btn-ghost back-link" onclick="cancelDGE()">&larr; Back</button>`
			: dgeFlowChromeHTML({ title: 'Your growth edges', step: 5 })}
		<div class="h1" style="margin-bottom:8px;">Name one to three, in your words.</div>
		<p class="caption" style="margin-bottom:16px;">They don&rsquo;t have to match the themes, and they don&rsquo;t have to sound tidy.</p>
		<label class="ge-label">First</label>
		<textarea class="dge-edge${dge.focus === 0 ? ' selected' : ''}" rows="3" onfocus="dgeFocusEdge(0)" id="dge-e0">${escapeHtml(dge.edges[0])}</textarea>
		<label class="ge-label">Second</label>
		<textarea class="dge-edge${dge.focus === 1 ? ' selected' : ''}" rows="2" onfocus="dgeFocusEdge(1)" id="dge-e1">${escapeHtml(dge.edges[1])}</textarea>
		<label class="ge-label">Third \u2014 optional</label>
		<textarea class="dge-edge${dge.focus === 2 ? ' selected' : ''}${thirdEmpty ? ' is-optional' : ''}" rows="2" onfocus="dgeFocusEdge(2);this.classList.remove('is-optional')" id="dge-e2" placeholder="Add another.">${escapeHtml(dge.edges[2])}</textarea>
		<button class="btn ${dge.fromEdit ? 'btn-commit' : 'btn-dark'} btn-block-mt" onclick="${dge.fromEdit ? 'finishDgeEdit()' : 'continueDgeEdges()'}">${dge.fromEdit ? 'Save my growth edges' : 'Continue'}</button>
		<div style="height:16px"></div>`);
}

function continueDgeEdges() {
	collectDgeEdges();
	renderDgeGhost();
}

function finishDgeEdit() {
	collectDgeEdges();
	App.growthEdges.edges = dge.edges.filter(Boolean);
	cancelDGE();
}

function renderDgeGhost() {
	clearSitTimers();
	setSitImmersive(false);
	exOverlay(`
		${dgeFlowChromeHTML({ title: 'Go steps', step: 7 })}
		<div class="h1" style="margin-bottom:8px;">What&rsquo;s one thing you can actually do?</div>
		<p class="caption" style="margin-bottom:14px;">One per line. Small and specific beats ambitious.</p>
		<textarea class="dge-edge" id="dge-go" rows="5" placeholder="Add a step">${escapeHtml(dge.go)}</textarea>
		<p class="caption" style="margin:4px 0 12px;">You can change any of this later.</p>
		<button class="btn btn-commit btn-block-mt" onclick="finishDGE()">Save my growth edges</button>
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
	const goEl = document.getElementById('dge-go');
	if (goEl) dge.go = goEl.value.trim();
	App.growthEdges.edges = dge.edges.filter(Boolean);
	App.growthEdges.goSteps = growthList(dge.go);
	App.dgeDone = true;
	App.dgeUnlocked = true;
	App.prep.dge = true;
	App.lastDgeDay = '2026-08-26';
	showTabBar();
	if (dge.fromPrep) {
		showScreen('prep-overlay');
		prepShowChecklist();
	} else {
		goTab('exercise');
	}
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
				<div class="h3">${dgeAgain ? 'Update growth edges' : 'Discernment of Growth Edges'}</div>
				<p class="caption" style="margin:0;">${dgeAgain ? 'Discern again \u2014 look across the season.' : 'Look across this season of practice.'}</p>
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
		<button class="btn btn-on-pigment btn-small" onclick="event.stopPropagation();startExercise({returnTab:'home'})">Begin</button>
	</div>`;
}

function renderPatterns(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	const count = App.exercises.length;
	if (count < 3) {
		el.innerHTML = `
		<div class="pattern-gate-card">
			<div class="h3" style="margin-bottom:8px;">Patterns are almost unlocked</div>
			<p class="caption">Complete 3 exercises to unlock your Patterns — you've done ${count} of 3.</p>
		</div>`;
		return;
	}
	if (App.tier !== 'circle') {
		el.innerHTML = `
		<div class="pattern-gate-card">
			<div class="h3" style="margin-bottom:8px;">Patterns</div>
			<p class="caption" style="margin-bottom:16px;">Upgrade to see the themes across your ${count} exercises.</p>
			<button class="btn btn-dark btn-small" onclick="showStub('Upgrade to unlock Patterns', 'Patterns are part of Growth Edges or Circle Community access. This demo doesn\\'t include a working purchase flow.', 'Back', function(){ goTab(App.currentTab); })">Upgrade</button>
		</div>
		<div class="pattern-mosaic-foot">${patternMosaicHTML({ dimmed: true })}</div>`;
		return;
	}
	el.innerHTML = `
		<p class="caption" style="margin-bottom:14px;">${escapeHtml(patternsAcrossCaption())} Tap a pattern to read the sentences behind it.</p>
		${patternMosaicHTML({ grid: true, tappable: true })}
		${mostPresentHTML()}`;
}

function patternsAcrossCaption() {
	const n = App.exercises.length;
	const since = earliestExerciseDay();
	const count = `Across ${n} exercise${n === 1 ? '' : 's'}`;
	return since ? `${count} since ${formatLongDay(since)}.` : `${count}.`;
}

function earliestExerciseDay() {
	let min = null;
	App.exercises.forEach(e => {
		(e.quotes || []).forEach(q => {
			const k = quoteDayKey(q);
			if (k && (!min || k < min)) min = k;
		});
	});
	return min;
}

function formatLongDay(dayKey) {
	const parts = String(dayKey || '').split('-');
	if (parts.length < 3) return '';
	const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	if (isNaN(dt.getTime())) return '';
	return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

function mostPresentHTML() {
	const quotes = getAllQuotes();
	const byTheme = {};
	quotes.forEach(q => { (byTheme[q.theme] = byTheme[q.theme] || []).push(q); });
	const keys = PATTERN_ORDER.filter(t => byTheme[t] && byTheme[t].length);
	if (!keys.length) return '';
	keys.sort((a, b) => byTheme[b].length - byTheme[a].length);
	const theme = keys[0];
	const q = byTheme[theme][0];
	if (!q) return '';
	return `
	<button type="button" class="card outlined static most-present" onclick="openExercisePattern('${theme}')">
		<div class="kicker">Most present</div>
		<div class="h3">${escapeHtml(PATTERN_META[theme].label)}</div>
		<div class="pattern-quote" style="border-left-color:var(--pig-${patternHue(theme)})">\u201C${escapeHtml(q.text)}\u201D</div>
	</button>`;
}

function mosaicPackRows(items) {
	const n = items.length;
	if (n <= 3) return [items];
	if (n === 4 || n === 5) return [items.slice(0, 2), items.slice(2)];
	const rows = [];
	for (let i = 0; i < n; i += 3) rows.push(items.slice(i, i + 3));
	return rows;
}

function patternMosaicHTML(opts) {
	opts = opts || {};
	const quotes = getAllQuotes();
	const byTheme = {};
	quotes.forEach(q => { (byTheme[q.theme] = byTheme[q.theme] || []).push(q); });
	const now = new Date();
	const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const keys = PATTERN_ORDER.filter(t => byTheme[t] && byTheme[t].length);
	if (!keys.length) return '';
	if (opts.grid) {
		const items = keys.map(theme => ({ theme, n: byTheme[theme].length }));
		const rows = mosaicPackRows(items);
		const html = rows.map(row => {
			const cells = row.map(item => {
				const qs = byTheme[item.theme];
				const hue = patternHue(item.theme);
				const thisMonth = qs.some(q => (quoteDayKey(q) || '').startsWith(monthPrefix));
				const fill = thisMonth ? `var(--pig-${hue})` : `var(--pig-${hue}-tint)`;
				const color = thisMonth ? 'var(--canvas)' : `var(--pig-${hue}-ink)`;
				const tap = opts.tappable ? `onclick="openExercisePattern('${item.theme}')"` : '';
				const tag = opts.tappable ? 'button' : 'div';
				const type = opts.tappable ? ' type="button"' : '';
				return `<${tag}${type} class="dge-tile" style="flex:${item.n} 0 0;background:${fill};color:${color}" ${tap}>
					<div class="h3">${PATTERN_META[item.theme].label}</div>
					<div class="pattern-mosaic-count">${item.n}</div>
				</${tag}>`;
			}).join('');
			return `<div class="pattern-mosaic-row">${cells}</div>`;
		}).join('');
		return `<div class="pattern-mosaic-grid">${html}</div>`;
	}
	const tiles = keys.map(theme => {
		const qs = byTheme[theme];
		const hue = patternHue(theme);
		const thisMonth = qs.some(q => (quoteDayKey(q) || '').startsWith(monthPrefix));
		const fill = thisMonth ? `var(--pig-${hue})` : `var(--pig-${hue}-tint)`;
		return `<span class="pattern-mosaic-tile" style="flex:${qs.length};background:${fill}"></span>`;
	}).join('');
	return `<div class="pattern-mosaic${opts.dimmed ? ' dimmed' : ''}" aria-hidden="true">${tiles}</div>`;
}

function openExercisePattern(theme) {
	const quotes = getAllQuotes().filter(q => q.theme === theme);
	const meta = PATTERN_META[theme];
	if (!meta) return;
	const hue = patternHue(theme);
	const n = quotes.length;
	const body = quotes.length
		? quotes.map(q => {
			const rec = App.exercises.find(e => e.id === q.exId);
			const sit = rec && rec.situation ? ' \u00b7 ' + rec.situation : '';
			return `<div class="pattern-quote" style="border-left-color:var(--pig-${hue})">
				\u201C${escapeHtml(q.text)}\u201D
				<span class="pattern-quote-date">${escapeHtml(q.date || '')}${escapeHtml(sit)}</span>
			</div>`;
		}).join('')
		: '<p class="caption">No sentences in this pattern yet.</p>';
	hideTabBar();
	showScreen('exercise-overlay');
	exOverlay(`
		<div class="dge-detail-head" style="background:var(--pig-${hue})">
			<div class="sit-chrome-nav">
				<button class="btn-ghost" onclick="closeExercisePattern()">&larr; Back</button>
			</div>
			<div class="kicker">${n ? `In ${n} exercise${n === 1 ? '' : 's'}` : 'In your words'}</div>
			<div class="h2">${escapeHtml(meta.label)}</div>
		</div>
		<p class="caption" style="margin-bottom:14px;">Your words, unedited.</p>
		${body}
		<div class="dge-detail-foot">${n} of ${n} shown</div>`);
}

function closeExercisePattern() {
	showTabBar();
	goTab('exercise');
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
	const countLine = q
		? `<div class="kicker past-result-count">${items.length} result${items.length === 1 ? '' : 's'}</div>`
		: '';
	el.innerHTML = countLine + items.map(rec => {
		const sit = q ? highlightMatch(rec.situation, q) : escapeHtml(rec.situation);
		const date = q ? highlightMatch(rec.date, q) : escapeHtml(rec.date);
		return `
		<button type="button" class="past-row" onclick="openPastRecap(${rec.id})">
			<span class="past-row-main">
				<span class="caption">${date}</span>
				<span class="past-row-sit">${sit}</span>
			</span>
			<span class="profile-chevron">&rsaquo;</span>
		</button>`;
	}).join('');
}

function highlightMatch(text, q) {
	const raw = String(text == null ? '' : text);
	const query = String(q || '').trim();
	if (!query) return escapeHtml(raw);
	const lower = raw.toLowerCase();
	const nq = query.toLowerCase();
	let out = '';
	let i = 0;
	while (i < raw.length) {
		const hit = lower.indexOf(nq, i);
		if (hit === -1) {
			out += escapeHtml(raw.slice(i));
			break;
		}
		out += escapeHtml(raw.slice(i, hit));
		out += `<mark class="past-mark">${escapeHtml(raw.slice(hit, hit + query.length))}</mark>`;
		i = hit + query.length;
	}
	return out;
}

let _pastRecapFrom = 'exercise';
function openPastRecap(id, from) {
	_pastRecapFrom = from || 'exercise';
	const rec = App.exercises.find(e => e.id === id);
	if (!rec) return;
	const data = recapFromRecord(rec);
	const backPlace = _pastRecapFrom === 'circle' ? 'Circle' : 'Past';
	hideTabBar();
	showScreen('exercise-overlay');
	exOverlay(`
		<button class="btn-ghost back-link" onclick="closePastRecap()">&larr; Back to ${backPlace}</button>
		${recapChromeHTML()}
		<div class="recap-scroll">
		${recapCardsHTML(data, `showAIInfo('exercise-overlay', function(){ openPastRecap(${id}${from ? ", '" + from + "'" : ''}); })`)}
		</div>
		<div style="height:16px"></div>`);
}

function closePastRecap() {
	showTabBar();
	if (_pastRecapFrom === 'circle') openConnectSession(currentSessionIdx);
	else goTab('exercise');
}

/* ==========================================================================
   SESSION 1 PREP — container: intro -> {Classroom set, Exercise, Reflect}
   ========================================================================== */
function checkPrepClassroomComplete() {
	const anySession1Watched = CLASSROOM_CHUNKS.some((c, i) => c.session1 && App.classroomWatched.has(i));
	App.prep.classroom = anySession1Watched;
}

function prepKeys() {
	return App.dgeUnlocked ? ['classroom', 'dge', 'reflect'] : ['classroom', 'exercise', 'reflect'];
}

function prepDoneCount() {
	return prepKeys().filter(k => App.prep[k]).length;
}

function prepTotalCount() {
	return prepKeys().length;
}

function prepNextIncomplete() {
	if (!App.prep.classroom) return { step: 'classroom', title: 'Learning' };
	if (App.dgeUnlocked) {
		if (!App.prep.dge) return { step: 'dge', title: App.dgeDone ? 'Update growth edges' : 'Discernment of Growth Edges' };
	} else if (!App.prep.exercise) {
		return { step: 'exercise', title: 'Personal exercise' };
	}
	if (!App.prep.reflect) return { step: 'reflect', title: 'Reflect' };
	return null;
}

function prepCompactHTML(opts) {
	opts = opts || {};
	const doneCount = prepDoneCount();
	const total = prepTotalCount();
	const allDone = doneCount === total;
	const next = prepNextIncomplete();
	const rec = App.exercises.length ? App.exercises[App.exercises.length - 1] : null;
	const ret = opts.returnScreen || 'connect-session-overlay';
	if (allDone) {
		return `
		<div class="prep-compact">
			<div class="progress-bg"><div class="progress-fill" style="width:100%"></div></div>
			<p class="caption" style="margin:0 0 6px;">What you brought</p>
			${rec ? `<button type="button" class="btn-ghost" onclick="openPastRecap(${rec.id}, 'circle')">Open recap</button>` : ''}
			<button type="button" class="btn-ghost" onclick="startPrepFlow({toChecklist:true, returnScreen:'${ret}'})">View prep</button>
		</div>`;
	}
	return `
		<div class="prep-compact">
			<div class="progress-bg"><div class="progress-fill" style="width:${(doneCount / total) * 100}%"></div></div>
			<p class="body-text" style="margin:0;">Next: ${escapeHtml(next.title)}</p>
			<button type="button" class="btn-ghost" onclick="openPrepStep('${next.step}', '${ret}')">Continue prep</button>
		</div>`;
}

let sessionPrepOpen = false;

function prepSegHTML() {
	const doneCount = prepDoneCount();
	const total = prepTotalCount();
	return `<div class="prep-seg">${Array.from({ length: total }, (_, i) => `<i class="${i < doneCount ? 'on' : ''}"></i>`).join('')}</div>`;
}

function prepCardHTML(opts) {
	opts = opts || {};
	const variant = opts.variant || 'session';
	const isHome = variant === 'home';
	const open = isHome ? true : sessionPrepOpen;
	const doneCount = prepDoneCount();
	const total = prepTotalCount();
	const allDone = doneCount === total;
	const next = prepNextIncomplete();
	const ret = isHome ? '' : 'connect-session-overlay';
	const sessionTitle = App.dgeUnlocked ? 'Session 4' : 'Session 1';
	const heading = allDone
		? (App.dgeUnlocked ? "You\u2019re ready for Session 4" : "You\u2019re ready for Session 1")
		: 'Prep for the gathering';
	const kicker = isHome ? `${sessionTitle} \u00b7 Coming up` : 'On your own';
	const toChecklist = allDone || doneCount > 0;
	const flowArg = `{toChecklist:${toChecklist}${ret ? `, returnScreen:'${ret}'` : ''}}`;
	const footLabel = allDone ? "You\u2019re ready" : (next ? `${next.title} left to do` : '');
	const cta = allDone ? 'View prep' : 'Open prep';
	const headRight = isHome
		? `<div class="session-menu">
				<button type="button" class="session-menu-btn" onclick="event.stopPropagation();toggleSessionMenu(event)" aria-label="Session options" aria-expanded="false">&#8942;</button>
				<div class="session-menu-dropdown" hidden>
					<button type="button" class="session-menu-item" onclick="event.stopPropagation();markSessionCompleted(0)">Mark Session 1 completed</button>
				</div>
			</div>`
		: `<span class="session-prep-chevron" aria-hidden="true">&#9662;</span>`;
	const headTag = isHome ? 'div' : 'button';
	const headAttrs = isHome
		? ' class="session-prep-head"'
		: ` type="button" class="session-prep-head" onclick="toggleSessionPrep()" aria-expanded="${open ? 'true' : 'false'}"`;
	const foot = isHome ? '' : `
		<div class="session-prep-foot">
			<span class="caption">${escapeHtml(footLabel)}</span>
			<span class="btn btn-on-pigment btn-small" onclick="event.stopPropagation();startPrepFlow(${flowArg})">${cta}</span>
		</div>`;
	const privacy = isHome ? '' : `<p class="caption session-prep-privacy">None of this is shared with your Circle. You choose what to bring.</p>`;
	return `
		<div class="session-prep${open ? ' open' : ''}${isHome ? ' home-prep-stack' : ''}" id="${isHome ? 'acc-prep' : 'session-prep'}">
			<${headTag}${headAttrs}>
				<div class="session-prep-kicker-row">
					<span class="kicker">${escapeHtml(kicker)}</span>
					${headRight}
				</div>
				<div class="h3">${heading}</div>
				${prepSegHTML()}
				${foot}
			</${headTag}>
			<div class="session-prep-rows" ${isHome ? 'id="acc-prep-rows"' : ''}>${prepStepRowsHTML(ret || undefined, true)}</div>
		</div>
		${privacy}`;
}

function prepStackHTML() {
	return prepCardHTML({ variant: 'home' });
}

function sessionPrepCardHTML() {
	return prepCardHTML({ variant: 'session' });
}

function prepStepRowsHTML(returnScreen, asRecord) {
	const retArg = returnScreen ? `, '${returnScreen}'` : '';
	const row = (done, step, title, caption) => `
		<button type="button" class="prep-step" onclick="event.stopPropagation();openPrepStep('${step}'${retArg})">
			<div class="chk-circle${done ? ' done' : ''}">${done ? '&#10003;' : ''}</div>
			<div class="prep-step-body">
				<b>${escapeHtml(title)}</b>
				<p class="caption${asRecord && done && (step === 'exercise' || step === 'dge') ? ' prep-step-quote' : ''}">${caption}</p>
			</div>
			<span class="prep-step-chevron" aria-hidden="true">&#8250;</span>
		</button>`;
	const exerciseRow = App.dgeUnlocked
		? ''
		: row(App.prep.exercise, 'exercise', 'Personal exercise', prepRecordCaption('exercise', App.prep.exercise, asRecord));
	const dgeRow = App.dgeUnlocked
		? row(App.prep.dge, 'dge', App.dgeDone ? 'Update growth edges' : 'Discernment of Growth Edges', prepRecordCaption('dge', App.prep.dge, asRecord))
		: '';
	return `<div class="prep-steps">
		${row(App.prep.classroom, 'classroom', 'Learning', prepRecordCaption('classroom', App.prep.classroom, asRecord))}
		${exerciseRow}
		${dgeRow}
		${row(App.prep.reflect, 'reflect', 'Reflect', prepRecordCaption('reflect', App.prep.reflect, asRecord))}
	</div>`;
}

function prepRecordCaption(step, done, asRecord) {
	if (asRecord && done) {
		if (step === 'classroom') return 'Two short pieces \u00b7 watched';
		if (step === 'exercise') {
			const rec = App.exercises.length ? App.exercises[App.exercises.length - 1] : null;
			return rec && rec.situation ? `\u201C${escapeHtml(rec.situation)}\u201D` : 'Done';
		}
		if (step === 'dge') {
			const edge = App.growthEdges && App.growthEdges.edges && App.growthEdges.edges[0];
			return edge ? `\u201C${escapeHtml(edge)}\u201D` : 'Done';
		}
		if (step === 'reflect') return App.prep.reflectText ? escapeHtml(App.prep.reflectText) : 'Named a takeaway';
	}
	if (step === 'classroom') return 'Short pieces for this session \u2014 not the whole library.';
	if (step === 'exercise') return 'A guided exercise on your own, in service of this gathering.';
	if (step === 'dge') return App.dgeDone ? 'Look across the season again.' : 'This session\'s exercise \u2014 look across the season together.';
	if (step === 'reflect') return 'Name one takeaway to bring into the room.';
	return 'Done';
}

function openPrepStep(step, returnScreen) {
	startPrepFlow({ toChecklist: true, returnScreen: returnScreen || null });
	if (step === 'classroom') prepShowClassroom();
	else if (step === 'exercise') prepGoExercise();
	else if (step === 'dge') startDGE({ fromPrep: true });
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

function circleBandHTML(inner) {
	return `<div class="circle-band">${inner}</div>`;
}

function prepShowIntro() {
	showTabBar();
	prepOverlay(`
		${circleBandHTML(`
			<button class="btn-ghost back-link" onclick="closePrepOverlay()">&larr; Back</button>
			<div class="h1">Getting ready for the Circle</div>
		`)}
		<p class="body-text" style="margin-bottom:20px;">${App.dgeUnlocked
			? 'Session 4 is coming up. The exercise for this session is Discernment of Growth Edges \u2014 looking across the season, not one situation \u2014 plus Learning and Reflect.'
			: 'Session 1 is coming up. Spend a few unhurried minutes on your own \u2014 a short Learning piece, a personal exercise, and Reflect. Together, they\'ll help you show up for Circle.'}</p>
		<button class="btn btn-dark btn-block-mt" onclick="prepShowChecklist()">Let's Get Prepped &rarr;</button>
		<div style="height:16px"></div>`);
}

function prepShowChecklist() {
	showTabBar();
	const doneCount = prepDoneCount();
	const total = prepTotalCount();
	const allDone = doneCount === total;
	const exerciseItem = App.dgeUnlocked ? '' : `
		<div class="card outlined prep-checklist-item" onclick="prepGoExercise()">
			<div class="chk-circle${App.prep.exercise ? ' done' : ''}">${App.prep.exercise ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Personal Exercise</b><p class="caption" style="margin:0;">Complete your personal exercise — done on your own.</p></div>
		</div>`;
	const dgeItem = App.dgeUnlocked ? `
		<div class="card outlined prep-checklist-item" onclick="startDGE({ fromPrep: true })">
			<div class="chk-circle${App.prep.dge ? ' done' : ''}">${App.prep.dge ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">${App.dgeDone ? 'Update growth edges' : 'Discernment of Growth Edges'}</b><p class="caption" style="margin:0;">${App.dgeDone ? 'Look across the season again.' : 'This session\'s exercise — look across the season together.'}</p></div>
		</div>` : '';
	prepOverlay(`
		${circleBandHTML(`
			<button class="btn-ghost back-link" onclick="closePrepOverlay()">&larr; Back to Home</button>
			<div class="h1">Your Prep Checklist</div>
			<p class="caption" style="margin:6px 0 0;">${doneCount} of ${total} complete</p>
		`)}
		<div class="card outlined prep-checklist-item" onclick="prepShowClassroom()">
			<div class="chk-circle${App.prep.classroom ? ' done' : ''}">${App.prep.classroom ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Learning</b><p class="caption" style="margin:0;">A few short pieces for this session.</p></div>
		</div>
		${exerciseItem}
		${dgeItem}
		<div class="card outlined prep-checklist-item" onclick="prepShowReflect()">
			<div class="chk-circle${App.prep.reflect ? ' done' : ''}">${App.prep.reflect ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Reflect &amp; Prep</b><p class="caption" style="margin:0;">One takeaway to bring to the group.</p></div>
		</div>
		${allDone ? `<button class="btn btn-dark btn-block-mt" onclick="closePrepOverlay()">Done</button>` : ''}
		<div style="height:16px"></div>`);
}

function prepShowClassroom() {
	prepOverlay(`
		${circleBandHTML(`
			<button class="btn-ghost back-link" onclick="prepShowChecklist()">&larr; Back to Prep</button>
			<div class="h1">Learning</div>
			<p class="caption" style="margin:6px 0 0;">A short set of pieces bundled for Session 1.</p>
		`)}
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
		${circleBandHTML(`
			<button class="btn-ghost back-link" onclick="prepShowChecklist()">&larr; Back to Prep</button>
			<div class="h1">Reflect &amp; Prep</div>
		`)}
		<p class="body-text" style="margin-bottom:8px;">What is one takeaway you want to share with your group tonight?</p>
		${renderInputTriadHTML('triad-reflect')}
		<button class="btn btn-dark btn-block-mt" onclick="prepSubmitReflect()">Submit</button>
		<div style="height:16px"></div>`);
}

function prepSubmitReflect() {
	const el = document.getElementById('triad-reflect');
	if (el && el.value.trim()) App.prep.reflectText = el.value.trim();
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
			<button class="guide-mode-btn" data-mode="play" onclick="switchCardTab(this,'play')">Play</button>
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
	const nextIdx = upNextSessionIdx();
	const doneCount = prepDoneCount();
	const total = prepTotalCount();
	overview.innerHTML = `
		<button type="button" class="connect-overview" onclick="openCircleOverview()">
			<div class="topic-card-art circle-video-art">
				<span class="topic-kind">Video</span>
				<span class="topic-play">&#9654;</span>
			</div>
			<div class="topic-card-title">The Circle Experience</div>
			<div class="topic-card-sub">2 min \u00b7 How a Circle works together</div>
		</button>`;
	list.innerHTML = CIRCLE_SESSIONS.map((s, i) => {
		const upNext = i === nextIdx && s.status !== 'Completed';
		const later = !upNext;
		const kicker = s.status === 'Completed' ? 'Completed \u00b7 60 min' : (upNext ? 'Up next \u00b7 60 min' : 'Later \u00b7 60 min');
		const prepped = upNext ? `<span class="caption">${doneCount} of ${total} prepped</span>` : '';
		const blurb = upNext
			? `<p class="caption">Prepare on your own, or open the gathering when you are together.</p>`
			: '';
		return `
		<button type="button" class="session-index-card${upNext ? ' up-next' : ''}${later ? ' later' : ''}" onclick="openConnectSession(${i})">
			<div class="session-index-meta">
				<span class="kicker">${kicker}</span>
				${prepped}
			</div>
			<div class="h3">${escapeHtml(s.title)}</div>
			${blurb}
		</button>`;
	}).join('');
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
				<span class="fac-note-title">Facilitator note: before you begin</span>
				<span class="fac-note-chevron">&#8250;</span>
			</div>
			<div class="fac-note-body">${FAC_NOTE.body}</div>
		</div>
		${session.sections.map((sec, si) => `
			<div class="section-group">
				<div class="section-group-title"><span>${escapeHtml(sec.name)}</span><span>${sec.start}\u2013${sec.end} min</span></div>
				${sec.subs.map((sub, bi) => `
					<div class="guide-item" onclick="openGuidePiece(${si},${bi})">
						<div class="guide-num">${bi + 1}</div>
						<div class="guide-text"><div class="title">${escapeHtml(sub.title)}</div><div class="sub">${sub.readAloud ? 'Read aloud to the group' : 'Facilitator instructions'}</div></div>
					</div>`).join('')}
			</div>`).join('')}`;
}

function upNextSessionIdx() {
	const i = CIRCLE_SESSIONS.findIndex(s => s.status !== 'Completed');
	return i < 0 ? CIRCLE_SESSIONS.length - 1 : i;
}

function toggleSessionPrep() {
	sessionPrepOpen = !sessionPrepOpen;
	const el = document.getElementById('session-prep');
	if (!el) return;
	el.classList.toggle('open', sessionPrepOpen);
	const btn = el.querySelector('.session-prep-head');
	if (btn) btn.setAttribute('aria-expanded', sessionPrepOpen ? 'true' : 'false');
}

function openConnectSession(idx, opts) {
	if (typeof idx === 'number' && idx !== currentSessionIdx) sessionPrepOpen = false;
	if (typeof idx === 'number') currentSessionIdx = idx;
	const session = currentSession();
	const nextIdx = upNextSessionIdx();
	const statusLine = session.status === 'Completed'
		? 'Completed \u00b7 60 min gathering'
		: (currentSessionIdx === nextIdx ? 'Up next \u00b7 60 min gathering' : 'Later \u00b7 60 min gathering');
	const facItem = `<button type="button" class="session-menu-item" onclick="startFacilitatorMode()">Facilitator Mode</button>`;
	document.getElementById('connect-session-body').innerHTML = `
		<button class="btn-ghost back-link" onclick="goTab('connect')">&larr; Back to Circle</button>
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
		<p class="caption" style="margin:0 0 16px;">${statusLine}</p>
		${sessionPrepCardHTML()}
		<div class="session-room-block">
			<div class="kicker">Together</div>
			<div class="h3">In the room</div>
			<p class="caption" style="margin-bottom:14px;">The agenda for the gathering.</p>
			${gatheringAgendaHTML(session)}
		</div>
		<div class="session-open-bar">
			<button class="btn btn-dark" onclick="startFacilitatorMode()">Open the gathering</button>
		</div>`;
	hideTabBar();
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
		<div class="profile-section">Account</div>
		<div class="profile-group">
			${profileRow('Name', escapeHtml(App.firstName), "openProfilePage('name')")}
			${profileRow('Email', 'placeholder@email.com', "openProfilePage('email')")}
			${profileRow('Password', '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', "openProfilePage('password')")}
		</div>
		<div class="profile-section">Settings</div>
		<div class="profile-group">
			${profileRow('Notifications', 'Session reminders on', "openProfilePage('settings')")}
			${circleRow}
		</div>
		<div class="profile-section">Help</div>
		<div class="profile-group">
			${profileRow('FAQs', 'Common questions', "openProfilePage('faqs')")}
			${profileRow('Need Help?', 'Reach a person', "openProfilePage('help')")}
			${profileRow('AI Transparency Statement', 'How AI is used here', "openProfilePage('ai')")}
			${profileRow('Privacy', 'What stays yours', "openProfilePage('privacy')")}
		</div>
		<div class="profile-group">
			${profileRow('Sign out', '', "showStub('Sign out', 'This demo doesn\\'t include a working sign-out.', 'Back', function(){ goTab('profile'); })")}
		</div>
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
		<div class="stub-wrap">
			<div class="stub-card">
				<div class="h2">${escapeHtml(title)}</div>
				<p class="body-text">${escapeHtml(body)}</p>
				<button class="btn btn-dark" onclick="_stubPrimaryAction()">${escapeHtml(primaryLabel || 'Back')}</button>
			</div>
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
		tip: true,
		onEnd: function() { App.fabCoached = true; },
		steps: [{
			title: '',
			body: 'Start a personal exercise here, whenever you have twenty minutes.',
			selector: '#ex-fab',
			pill: false,
			round: true
		}]
	};
	overlay.classList.add('open', 'is-tip');
	overlay.setAttribute('aria-hidden', 'false');
	overlay.onclick = function() { endCoachTour(); };
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
		positionCoachTarget(document.querySelector(step.selector), step.pill, step.round);
	});
}

function updateCoachChrome() {
	if (!_coach) return;
	document.getElementById('coach-page').textContent = `${_coach.step + 1}/${_coach.total}`;
	const nextBtn = document.querySelector('#coach-overlay .btn-small');
	if (nextBtn) nextBtn.textContent = _coach.step === _coach.total - 1 ? 'Got it' : 'Next';
}

function positionCoachTarget(target, pill, round) {
	const overlay = document.getElementById('coach-overlay');
	const hole = document.getElementById('coach-hole');
	const bubble = document.getElementById('coach-bubble');
	if (!overlay || !hole || !bubble || !target) return;
	const frame = overlay.getBoundingClientRect();
	const tr = target.getBoundingClientRect();
	const pad = pill ? 6 : 8;
	hole.classList.toggle('pill', !!pill);
	hole.classList.toggle('round', !!round);
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
		overlay.classList.remove('open', 'is-tip');
		overlay.onclick = null;
		overlay.setAttribute('aria-hidden', 'true');
	}
	if (onEnd) onEnd();
}
