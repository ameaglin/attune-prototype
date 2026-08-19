/* ==========================================================================
   Attune Round 2 Prototype — shared.js
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
	type: '<path d="M5 19 L8.2 17.8 L18.2 7.8 C18.8 7.2 18.8 6.3 18.2 5.7 L16.3 3.8 C15.7 3.2 14.8 3.2 14.2 3.8 L4.2 13.8 L3 17 Z"/><path d="M13.4 5.6 L16.4 8.6"/>',
	speak: '<rect x="9" y="4" width="6" height="10" rx="3"/><path d="M7 12 C7 15.3 9.2 18 12 18 S17 15.3 17 12"/><path d="M12 18 V21"/>',
	settings: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.2"/><path d="M12 2.2 V4.6 M12 19.4 V21.8 M2.2 12 H4.6 M19.4 12 H21.8 M5.1 5.1 L6.8 6.8 M17.2 17.2 L18.9 18.9 M18.9 5.1 L17.2 6.8 M6.8 17.2 L5.1 18.9"/>'
};

function glyphIcon(name) {
	return `<svg class="glyph-icon" viewBox="0 0 24 24" aria-hidden="true">${GLYPH_PATHS[name] || ''}</svg>`;
}

function decorateTabIcons() {
	const labels = { home: 'Home', exercise: 'Exercise', explore: 'Explore', connect: 'Community' };
	document.querySelectorAll('.tab-item[data-tab]').forEach(item => {
		const tab = item.dataset.tab;
		item.innerHTML = `${glyphIcon(tab)}<span>${labels[tab] || tab}</span>`;
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
	classroomWatched: new Set(), // shared watched-state, indices into CLASSROOM_CHUNKS
	prep: { classroom: false, exercise: false, reflect: false, homeDismissed: false },
	renderers: {}, // { home, exercise, explore, connect } -> fn()

	init() {
		decorateTabIcons();
		hideTabBar(); // stays hidden until finishOnboarding() -> goTab('home') reveals it
	}
};

/* -------------------------------------------------------------------------
   Generic screen + tab-bar plumbing (shared screen/active convention)
   ------------------------------------------------------------------------- */
function showScreen(id) {
	document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
	const el = document.getElementById(id);
	if (el) el.classList.add('active');
}

function setTabActive(tab) {
	document.querySelectorAll('.tab-item').forEach(item => {
		item.classList.toggle('active', item.dataset.tab === tab);
	});
}

function hideTabBar() {
	const bar = document.querySelector('.tab-bar');
	if (bar) bar.style.display = 'none';
}
function showTabBar() {
	const bar = document.querySelector('.tab-bar');
	if (bar) bar.style.display = '';
}

function goTab(tab) {
	App.currentTab = tab;
	showScreen(tab);
	setTabActive(tab);
	showTabBar();
	if (App.renderers[tab]) App.renderers[tab]();
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

const ex = { mode: 'training', warmup: null, stepIdx: 0, responses: [], returnTab: 'exercise', fromPrep: false, rating: 0 };

function startExercise(opts) {
	ex.mode = 'training';
	ex.warmup = null;
	ex.stepIdx = 0;
	ex.responses = [];
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
	exOverlay(`
		<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;">
			<div class="privacy-icon">&#128274;</div>
			<div class="h2" style="margin-bottom:12px;">Before you begin</div>
			<p class="body-text" style="margin-bottom:10px;">What you share here is private. It's not shared with a facilitator or your group unless you choose to share it.</p>
			<p class="caption" style="margin-bottom:28px;"><a href="javascript:void(0)" onclick="showAIInfo('exercise-overlay', renderExercisePrivacy)" style="color:inherit;text-decoration:underline;">How is AI used?</a></p>
			<button class="btn btn-dark" onclick="renderExerciseWarmup()">Continue</button>
			<button class="btn btn-ghost" style="margin-top:14px;align-self:center;" onclick="renderExerciseWarmup()">Don't show me this again</button>
		</div>`);
}

const WARMUP_MODES = [
	{ id: 'audio', label: 'Audio', desc: 'Listen to a short 3–4 min warm-up.' },
	{ id: 'words', label: 'Words', desc: 'Read the warm-up at your own pace.' },
	{ id: 'both', label: 'Audio + Words', desc: 'Listen and read along together.' }
];

function renderExerciseWarmup() {
	exOverlay(`
		<button class="btn-ghost back-link" onclick="renderExercisePrivacy()">&larr; Back</button>
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Warm-Up</div>
		<p class="caption" style="margin-bottom:16px;">A short warm-up before your personal exercise. Just listen or read — no need to respond.</p>
		<div class="warmup-mode-list" id="warmup-mode-list">
			${WARMUP_MODES.map(m => `
			<div class="card outlined" data-warmup="${m.id}" onclick="setWarmupMode('${m.id}')">
				<b style="font-size:15px;display:block;margin-bottom:4px;">${m.label}</b>
				<span class="caption">${m.desc}</span>
			</div>`).join('')}
		</div>
		<div id="warmup-preview"></div>
		<button class="btn btn-dark btn-block-mt" id="warmup-begin-btn" disabled onclick="renderExerciseStep(0)">Begin Personal Exercise &rarr;</button>
		<div style="height:16px"></div>`);
}

function setWarmupMode(id) {
	ex.warmup = id;
	document.querySelectorAll('#warmup-mode-list .card').forEach(c => {
		c.style.borderColor = c.dataset.warmup === id ? 'var(--ink)' : 'var(--line-strong)';
	});
	const preview = document.getElementById('warmup-preview');
	const mode = WARMUP_MODES.find(m => m.id === id);
	if (mode.id === 'audio') {
		preview.innerHTML = `<div class="card static" style="text-align:center;padding:24px;"><div class="triad-waveform" style="justify-content:center;">${Array.from({ length: 7 }).map((_, i) => `<span class="triad-wave-bar" style="height:${12 + (i * 4) % 22}px;animation-delay:${(i * 0.1).toFixed(1)}s"></span>`).join('')}</div><p class="caption">[ Playing warm-up audio · 3–4 min ]</p></div>`;
	} else if (mode.id === 'words') {
		preview.innerHTML = `<div class="card static"><p class="body-text" style="font-size:14px;">Take a moment to settle. Notice your breath, the weight of your body, the sounds around you. There's nothing to solve right now — just arrive, and let your attention soften before the exercise begins.</p></div>`;
	} else {
		preview.innerHTML = `<div class="card static" style="text-align:center;padding:24px;"><div class="triad-waveform" style="justify-content:center;">${Array.from({ length: 7 }).map((_, i) => `<span class="triad-wave-bar" style="height:${12 + (i * 4) % 22}px;animation-delay:${(i * 0.1).toFixed(1)}s"></span>`).join('')}</div><p class="caption" style="margin-bottom:10px;">[ Playing audio · 3–4 min ]</p><p class="body-text" style="font-size:13px;">Take a moment to settle. Notice your breath, the weight of your body, the sounds around you.</p></div>`;
	}
	document.getElementById('warmup-begin-btn').disabled = false;
}

function renderExerciseStep(idx) {
	ex.stepIdx = idx;
	const step = EXERCISE_STEPS[idx];
	const isLast = idx === EXERCISE_STEPS.length - 1;
	exOverlay(`
		<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
			<button class="btn-ghost" onclick="${idx === 0 ? "renderExerciseWarmup()" : `renderExerciseStep(${idx - 1})`}">&larr; Back</button>
			<button class="btn-ghost" onclick="cancelExercise()">&#10005; Exit</button>
		</div>
		<div class="exercise-topbar">
			<span class="exercise-step-count">Step ${idx + 1} of ${EXERCISE_STEPS.length}</span>
			<span class="caption">${escapeHtml(step.label)}</span>
		</div>
		<div class="seg-toggle" style="margin-top:12px;">
			<button class="seg-toggle-btn${ex.mode === 'practice' ? ' active' : ''}" onclick="setExerciseMode(this,'practice')">Practice</button>
			<button class="seg-toggle-btn${ex.mode === 'training' ? ' active' : ''}" onclick="setExerciseMode(this,'training')">Training</button>
		</div>
		<div id="ex-guidance-card" style="display:${ex.mode === 'training' ? 'block' : 'none'}">
			<div class="guidance-card"><p class="caption" style="color:var(--body);"><b style="color:var(--ink);">How this works:</b> Sit with the prompt for a moment — there's no right answer, just notice what comes up.</p></div>
			<div class="guidance-card" style="margin-top:-6px;"><p class="caption" style="color:var(--body);">${escapeHtml(step.hint)}</p></div>
		</div>
		<div class="prompt-card"><p class="prompt-text">${escapeHtml(step.prompt)}</p></div>
		${renderInputTriadHTML('triad-current')}
		<button class="btn btn-dark btn-block-mt" onclick="exerciseNext(${idx}, ${isLast})">${isLast ? 'Continue to Recap &rarr;' : 'Next &rarr;'}</button>
		<div style="height:16px"></div>`);
}

function setExerciseMode(btn, mode) {
	ex.mode = mode;
	document.querySelectorAll('.exercise-overlay .seg-toggle-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	document.getElementById('ex-guidance-card').style.display = mode === 'training' ? 'block' : 'none';
}

function exerciseNext(idx, isLast) {
	ex.responses[idx] = triadGetValue('triad-current');
	if (isLast) renderExerciseOutput();
	else renderExerciseStep(idx + 1);
}

function deriveTheme(stepIdx) { return PATTERN_ORDER[stepIdx % PATTERN_ORDER.length]; }

function renderExerciseOutput() {
	const themeKeys = [...new Set(EXERCISE_STEPS.map((_, i) => deriveTheme(i)))];
	exOverlay(`
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Your Recap</div>
		<p class="caption" style="margin-bottom:16px;">Here's a review of what came up — this is what you'd bring to your Circle Community.</p>
		<div style="flex:1;overflow-y:auto;">
		<div class="output-card recap-themes">
			<div class="output-step-label" style="display:flex;justify-content:space-between;align-items:baseline;">
				<span>Themes</span>
				<a href="javascript:void(0)" onclick="showAIInfo('exercise-overlay', renderExerciseOutput)" style="font-weight:400;text-transform:none;letter-spacing:normal;color:var(--muted);text-decoration:underline;">How is AI used?</a>
			</div>
			<div class="output-tags recap-theme-tags">${themeKeys.map(t => `<span class="tag outline">${PATTERN_META[t].label}</span>`).join('')}</div>
		</div>
		${EXERCISE_STEPS.map((step, i) => {
		const response = ex.responses[i] && ex.responses[i].length ? ex.responses[i] : '(no response captured)';
		return `
			<div class="output-card">
				<div class="output-step-label">${escapeHtml(step.label)}</div>
				<div class="output-response" style="margin-bottom:0;">${escapeHtml(response)}</div>
			</div>`;
	}).join('')}
		</div>
		<button class="btn btn-dark btn-block-mt" onclick="renderExerciseRating()">Continue &rarr;</button>
		<div style="height:16px"></div>`);
}

function renderExerciseRating() {
	exOverlay(`
		<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;">
			<div class="h2" style="margin-bottom:8px;">Rate this recap</div>
			<p class="caption" style="margin-bottom:6px;">Help us improve — this feeds nothing but our own learning.</p>
			<div class="rating-stars" id="rating-stars">
				${[1, 2, 3, 4, 5].map(n => `<span class="rating-star" data-n="${n}" onclick="setRating(${n})">&#9733;</span>`).join('')}
			</div>
			<button class="btn btn-dark" onclick="finishExercise()">Finish</button>
		</div>`);
}

function setRating(n) {
	ex.rating = n;
	document.querySelectorAll('#rating-stars .rating-star').forEach(s => {
		s.classList.toggle('filled', parseInt(s.dataset.n, 10) <= n);
	});
}

function buildExerciseRecord() {
	const num = App.exercises.length + 1;
	const situation = (ex.responses[0] && ex.responses[0].length) ? ex.responses[0] : 'A situation from today\u2019s exercise';
	const quoteAt = [1, 9]; // Self: Good Patterns, What's Resonating
	const quotes = quoteAt.map(i => {
		const text = (ex.responses[i] && ex.responses[i].length) ? ex.responses[i] : TRIAD_TRANSCRIPTS[i % TRIAD_TRANSCRIPTS.length];
		return { theme: deriveTheme(i), text, date: 'Today', day: quoteDayKey({ date: 'Today' }) };
	});
	return { id: num, date: 'Today', situation, quotes };
}

function cancelExercise() {
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
   CLASSROOM — shared data + rendering (Explore list + Session Prep set)
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

let _classroomListEl = null, _classroomProgressEl = null, _classroomFilter = null, _classroomReturnScreen = 'explore';

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

/* Home tab: relaxed horizontal-scroll preview of the Classroom (paid/Circle
   only) — browsing, not a task to complete. */
function exploreCardHTML(topicIdx, itemIdx, returnScreenId) {
	const item = EXPLORE_TOPICS[topicIdx].items[itemIdx];
	const back = returnScreenId ? `, '${returnScreenId}'` : '';
	return `
		<button type="button" class="topic-card" onclick="openExploreItem(${topicIdx}, ${itemIdx}${back})">
			<div class="topic-card-art art-${item.art}">
				<span class="topic-kind">${item.kind === 'video' ? 'Video' : 'Reading'}</span>
				${item.kind === 'video'
					? '<span class="topic-play">&#9654;</span>'
					: `<p class="topic-blurb">${escapeHtml(item.desc)}</p>`}
			</div>
			<div class="topic-card-title">${escapeHtml(item.title)}</div>
			<div class="topic-card-sub">${item.kind === 'video' ? 'Video \u00b7 ' + escapeHtml(item.duration) : 'Picture + Text'}</div>
		</button>`;
}

function renderHomeClasses(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	el.innerHTML = EXPLORE_TOPICS[0].items.map((_, i) => exploreCardHTML(0, i, 'home')).join('');
}

function renderExploreLanding(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	const free = App.tier === 'free';
	el.innerHTML = EXPLORE_TOPICS.map((topic, ti) => {
		const locked = free && !topic.free;
		return `
		<section class="topic-block">
			<div class="topic-head">
				<div class="h3">${escapeHtml(topic.title)}${locked ? ' <span class="tag outline" style="margin-left:6px;vertical-align:middle;">Community</span>' : ''}</div>
				<p class="caption">${escapeHtml(topic.desc)}</p>
			</div>
			${locked ? `
			<div class="card outlined dim" style="margin:0 20px 8px;cursor:pointer;" onclick="unlockExplore()">
				<b style="font-size:15px;display:block;margin-bottom:4px;">Included with Circle Community</b>
				<p class="caption" style="margin:0;">Upgrade or enter a Circle Community code to open this topic.</p>
			</div>` : `
			<div class="topic-rail">
				${topic.items.map((_, ii) => exploreCardHTML(ti, ii)).join('')}
			</div>`}
		</section>`;
	}).join('');
}

function unlockExplore() {
	showStub('Unlock more in Explore', 'Learning Attune is available on every plan. Additional topics come with Circle Community or a paid upgrade. This demo doesn\'t include a working purchase flow.', 'Back', function(){ goTab('explore'); });
}

function openExploreItem(topicIdx, itemIdx, returnScreenId) {
	const topic = EXPLORE_TOPICS[topicIdx];
	const item = topic.items[itemIdx];
	const backTo = returnScreenId || 'explore';
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

let _readingReturn = 'explore';
function openReading(item, returnScreenId) {
	_readingReturn = returnScreenId || 'explore';
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
		return { key: 'c' + i, title: c.title, duration: c.duration, desc: c.desc, badge: c.session1 ? 'Session 1' : 'Classroom' };
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
		</div>
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
		return `
		<div class="pattern-theme-card">
			<div class="pattern-theme-header">
				<span class="pattern-theme-icon">${meta.icon}</span>
				<span class="pattern-theme-name">${meta.label}</span>
				<span class="pattern-theme-count">${qs.length} entr${qs.length === 1 ? 'y' : 'ies'}</span>
			</div>
			${qs.slice(0, 3).map(q => `<div class="pattern-quote">\u201C${escapeHtml(q.text)}\u201D<span class="pattern-quote-date">${escapeHtml(q.date)}</span></div>`).join('')}
		</div>`;
	}).join('');
	const bridge = `
		<button class="btn btn-light" style="margin-top:6px;" onclick="showStub('Discernment of Growth Edges', 'This deeper, pattern-guided exercise is coming soon — it isn\\'t built yet in this prototype.', 'Back to Patterns', function(){ goTab(App.currentTab); })">Start Discernment of Growth Edges</button>`;
	el.innerHTML = aiLink + renderPatternCalendar(quotes) + cards + bridge;
}

/* -------------------------------------------------------------------------
   Past Exercises list (both tiers)
   ------------------------------------------------------------------------- */
function renderPastExercises(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	if (!App.exercises.length) {
		el.innerHTML = `<div class="empty-state">No recaps yet — start a personal exercise above.</div>`;
		return;
	}
	const items = App.exercises.slice().reverse();
	el.innerHTML = items.map(rec => {
		const tags = [...new Set(rec.quotes.map(q => q.theme))].map(t => `<span class="tag outline">${PATTERN_META[t].label}</span>`).join(' ');
		return `
		<div class="card outlined" style="cursor:default;">
			<div class="caption" style="margin-bottom:4px;">${escapeHtml(rec.date)}</div>
			<div class="body-text" style="font-size:14px;margin-bottom:8px;">${escapeHtml(rec.situation)}</div>
			<div class="output-tags">${tags}</div>
		</div>`;
	}).join('');
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
		<div class="h1" style="font-size:26px;margin-bottom:12px;">Getting ready for the Circle Community</div>
		<p class="body-text" style="margin-bottom:20px;">Session 1 is coming up. Whenever it feels right before then, spend a few unhurried minutes on your own — a short class, a personal exercise, and Reflect &amp; Prep for what you'll bring to the room. No need to do it all at once.</p>
		<button class="btn btn-dark btn-block-mt" onclick="prepShowChecklist()">Let's Get Prepped &rarr;</button>
		<div style="height:16px"></div>`);
}

function prepShowChecklist() {
	showTabBar();
	const doneCount = prepDoneCount();
	const allDone = doneCount === 3;
	prepOverlay(`
		<button class="btn-ghost back-link" onclick="closePrepOverlay()">&larr; Back to Home</button>
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Your Prep Checklist</div>
		<p class="prep-progress-caption">${doneCount} of 3 complete</p>
		<div class="card outlined prep-checklist-item" onclick="prepShowClassroom()">
			<div class="chk-circle${App.prep.classroom ? ' done' : ''}">${App.prep.classroom ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Classroom</b><p class="caption" style="margin:0;">A few short classes for this session.</p></div>
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
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Classroom</div>
		<p class="caption" style="margin-bottom:4px;">A short set of classes bundled for Session 1.</p>
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
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Reflect &amp; Prep</div>
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
	showToast('You can still find Session 1 prep in Community whenever you need it.');
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
			<div class="topic-card-title">The Circle Community Experience</div>
			<div class="topic-card-sub">Video \u00b7 2 min \u00b7 A quick overview of how Circle Community works together</div>
		</button>`;
	list.innerHTML = CIRCLE_SESSIONS.map((s, i) => `
		<div class="card outlined" onclick="openConnectSession(${i})">
			<div class="kicker">${escapeHtml(s.status)} \u00b7 60 min</div>
			<b style="font-size:16px;display:block;margin-bottom:4px;">${escapeHtml(s.title)}</b>
			<p class="caption" style="margin:0;">Arrival &amp; Grounding \u00b7 Breakouts \u00b7 Debrief \u00b7 Close</p>
		</div>`).join('');
}

function openCircleOverview() {
	openMediaFeed([{
		title: 'The Circle Community Experience',
		duration: '2 min',
		desc: 'A Circle Community is a small group moving through a shared season together. You prepare on your own. You gather in person. The app holds Facilitator Mode for the room — and your own prep stays yours.',
		badge: 'Community'
	}], 0, 'connect');
}

function openConnectSession(idx) {
	currentSessionIdx = idx;
	const session = currentSession();
	const doneCount = prepDoneCount();
	const allDone = doneCount === 3;
	const openOpts = `{toChecklist:true, returnScreen:'connect-session-overlay'}`;
	document.getElementById('connect-session-body').innerHTML = `
		<button class="btn-ghost back-link" onclick="goTab('connect')">&larr; Back to Community</button>
		<div class="kicker">Circle Community</div>
		<div class="h1" style="font-size:26px;margin-bottom:6px;">${escapeHtml(session.title)}</div>
		<p class="caption" style="margin-bottom:16px;">${escapeHtml(session.status)} \u00b7 60 min gathering</p>
		<div class="card outlined prep-home-card" onclick="startPrepFlow(${openOpts})">
			<div class="kicker">Your Prep</div>
			<b style="font-size:16px;display:block;margin-bottom:4px;">${allDone ? "You're ready for this gathering" : 'Get ready on your own'}</b>
			<p class="caption" style="margin-bottom:10px;">Classroom \u00b7 Personal Exercise \u00b7 Reflect &amp; Prep \u00b7 ${doneCount} of 3 done</p>
			<div class="progress-bg"><div class="progress-fill" style="width:${(doneCount / 3 * 100).toFixed(0)}%"></div></div>
			<button class="btn btn-light btn-small" style="margin-top:10px;" onclick="event.stopPropagation();startPrepFlow(${openOpts})">${allDone ? 'Open Checklist' : doneCount > 0 ? 'Continue Prep' : "Let's Get Prepped"}</button>
		</div>
		<button class="start-live-btn" onclick="startFacilitatorMode()">&#9654; Start Facilitator Mode</button>
		<div class="fac-note" id="fac-note">
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
			</div>`).join('')}
		<div style="height:16px"></div>`;
	showTabBar();
	showScreen('connect-session-overlay');
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
	openConnectSession(currentSessionIdx);
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
	openConnectSession(currentSessionIdx);
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
		? `<div class="card outlined" onclick="showStub('Leave Circle Community', 'This demo doesn\\'t include a working leave flow.', 'Back', function(){ openSettings(); })"><b style="font-size:15px;display:block;margin-bottom:4px;">Circle Community</b><p class="caption" style="margin:0;">CIRCLE-2026 &middot; Leave this Circle Community</p></div>`
		: `<div class="card outlined" onclick="showStub('Add a Circle Community', 'Enter a code from your organizer to join a Circle Community. This demo doesn\\'t include a working join flow yet.', 'Back', function(){ openSettings(); })"><b style="font-size:15px;display:block;margin-bottom:4px;">Circle Community</b><p class="caption" style="margin:0;">Not in a Circle Community yet &middot; Add one</p></div>`;
	document.getElementById('settings-body').innerHTML = `
		<button class="btn-ghost back-link" onclick="goTab('home')">&larr; Back</button>
		<div class="h2" style="margin-bottom:18px;">Settings</div>
		<div class="card outlined" style="cursor:default;"><b style="font-size:15px;display:block;margin-bottom:4px;">Name</b><p class="caption" style="margin:0;">${escapeHtml(App.firstName)} &middot; Editable later</p></div>
		<div class="card outlined" style="cursor:default;"><b style="font-size:15px;display:block;margin-bottom:4px;">Email</b><p class="caption" style="margin:0;">placeholder@email.com</p></div>
		<div class="card outlined" style="cursor:default;"><b style="font-size:15px;display:block;margin-bottom:4px;">Password</b><p class="caption" style="margin:0;">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</p></div>
		<div class="card outlined" style="cursor:default;"><b style="font-size:15px;display:block;margin-bottom:4px;">Notifications</b><p class="caption" style="margin:0;">Session reminders on</p></div>
		${circleRow}
		<div style="height:16px"></div>`;
	showScreen('settings');
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
		selector: '#home-prep-card-slot .card',
		pill: false
	},
	{
		title: 'Home',
		body: "Home is your overview — what's next for Circle Community, a personal exercise whenever you have a quiet moment, and a window into how your patterns are growing.",
		selector: '.tab-item[data-tab="home"]',
		pill: true
	},
	{
		title: 'Exercise',
		body: 'Come here anytime you want to do a personal exercise — on your own. As you go, this is also where you can watch your patterns grow, and look back at recaps.',
		selector: '.tab-item[data-tab="exercise"]',
		pill: true
	},
	{
		title: 'Explore',
		body: 'Explore is where you connect with content — short videos and picture + text, when you want to sit with an idea on your own.',
		selector: '.tab-item[data-tab="explore"]',
		pill: true
	},
	{
		title: 'Community',
		body: 'Community is home for your Circle Community — a short overview, your sessions, your own prep, and Facilitator Mode, which everyone in the group can open.',
		selector: '.tab-item[data-tab="connect"]',
		pill: true
	}
];

let _coach = null;

function startCoachTour() {
	if (!document.getElementById('coach-overlay')) return;
	if (_coach) return;
	const begin = () => {
		if (!document.querySelector('#home-prep-card-slot .card')) return;
		const overlay = document.getElementById('coach-overlay');
		const rail = document.getElementById('coach-rail');
		rail.classList.add('no-swipe');
		rail.onscroll = null;
		_coach = { step: 0, total: COACH_STEPS.length };
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

function renderCoachStep() {
	if (!_coach) return;
	const step = COACH_STEPS[_coach.step];
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
	const overlay = document.getElementById('coach-overlay');
	const rail = document.getElementById('coach-rail');
	if (rail) rail.onscroll = null;
	_coach = null;
	if (overlay) {
		overlay.classList.remove('open');
		overlay.setAttribute('aria-hidden', 'true');
	}
}
