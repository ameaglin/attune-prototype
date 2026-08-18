/* ==========================================================================
   Attune Round 2 Prototype — shared.js
   Shared engines used by both paid-circle.html and free.html:
   tab nav, dot-grid streak, input triad, Exercise Experience, Patterns,
   Classroom, Session Prep, Facilitator Guide (Connect).
   No persistence — all state lives in memory for the life of the page.
   ========================================================================== */

function escapeHtml(str) {
	return String(str == null ? '' : str)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
	prep: { classroom: false, exercise: false, reflect: false, dismissed: false },
	streakDone: new Set([1, 3]), // Mon, Wed done (demo seed); today = index 4 (Thu)
	streakToday: 4,
	renderers: {}, // { home, exercise, explore, connect } -> fn()

	init() {
		renderStreak('streak-row', this.streakDone, this.streakToday);
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
   Dot-grid weekly streak (Home, both personas — not tier-gated)
   ------------------------------------------------------------------------- */
function renderStreak(containerId, doneSet, todayIdx) {
	const el = document.getElementById(containerId);
	if (!el) return;
	const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	el.innerHTML = days.map((d, i) => {
		const done = doneSet.has(i);
		const isToday = i === todayIdx;
		return `<div class="streak-day"><span class="streak-day-label">${d}</span><span class="streak-dot${done ? ' done' : ''}${isToday ? ' today' : ''}"></span></div>`;
	}).join('');
}

/* -------------------------------------------------------------------------
   Type / Voice Note / Speak input triad
   Renders into any container; each instance needs a unique rootId.
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
				<span class="triad-icon">&#9998;</span><span class="triad-btn-label">Type</span>
			</button>
			<button type="button" class="triad-btn" data-mode="voice" onclick="triadSetMode(this,'voice')">
				<span class="triad-icon">&#8776;</span><span class="triad-btn-label">Voice Note</span>
			</button>
			<button type="button" class="triad-btn" data-mode="speak" onclick="triadSetMode(this,'speak')">
				<span class="triad-icon">&#9679;</span><span class="triad-btn-label">Speak</span>
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
		const label = mode === 'speak' ? 'Speaking…' : 'Listening…';
		body.innerHTML = `
		<div class="triad-panel">
			<div class="triad-voice-status"><span class="triad-rec-dot"></span><span class="caption" style="color:var(--ink);font-weight:600;">${label}</span></div>
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
			<p class="body-text" style="margin-bottom:28px;">What you share here is private. It's not shared with a facilitator or your group unless you choose to share it.</p>
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
		<p class="caption" style="margin-bottom:16px;">A short warm-up before your Attunement Exercise. Just listen or read — no need to respond.</p>
		<div class="warmup-mode-list" id="warmup-mode-list">
			${WARMUP_MODES.map(m => `
			<div class="card outlined" data-warmup="${m.id}" onclick="setWarmupMode('${m.id}')">
				<b style="font-size:15px;display:block;margin-bottom:4px;">${m.label}</b>
				<span class="caption">${m.desc}</span>
			</div>`).join('')}
		</div>
		<div id="warmup-preview"></div>
		<button class="btn btn-dark btn-block-mt" id="warmup-begin-btn" disabled onclick="renderExerciseStep(0)">Begin Exercise &rarr;</button>
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
		<button class="btn btn-dark btn-block-mt" onclick="exerciseNext(${idx}, ${isLast})">${isLast ? 'Continue to Output &rarr;' : 'Next &rarr;'}</button>
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
	exOverlay(`
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Your Output</div>
		<p class="caption" style="margin-bottom:16px;">Here's a review of what came up — this is what you'd bring to your Circle.</p>
		<div style="flex:1;overflow-y:auto;">
		${EXERCISE_STEPS.map((step, i) => {
		const response = ex.responses[i] && ex.responses[i].length ? ex.responses[i] : '(no response captured)';
		const theme = deriveTheme(i);
		return `
			<div class="output-card">
				<div class="output-step-label">${escapeHtml(step.label)}</div>
				<div class="output-response">${escapeHtml(response)}</div>
				<div class="output-tags"><span class="tag outline">${PATTERN_META[theme].label}</span></div>
			</div>`;
	}).join('')}
		</div>
		<button class="btn btn-dark btn-block-mt" onclick="renderExerciseRating()">Continue &rarr;</button>
		<div style="height:16px"></div>`);
}

function renderExerciseRating() {
	exOverlay(`
		<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;">
			<div class="h2" style="margin-bottom:8px;">Rate this summary</div>
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
		return { theme: deriveTheme(i), text, date: 'Today' };
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
	{ title: 'Listening Without Fixing', duration: '2 min', desc: 'Why the goal in a Circle is presence, not problem-solving.', session1: true },
	{ title: 'Practicing Presence', duration: '1.5 min', desc: 'A short practice for settling into the room before a session begins.', session1: true },
	{ title: 'Living Unhurried', duration: '2 min', desc: 'On resisting the urge to rush your own discernment.', session1: false },
	{ title: "Naming What's True", duration: '1.5 min', desc: 'A short teaching on naming what\u2019s actually happening, without spin.', session1: false }
];

let _classroomListEl = null, _classroomProgressEl = null, _classroomFilter = null, _classroomOpenIdx = null, _classroomReturnScreen = 'explore';

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
		<div class="classroom-item${watched ? ' watched' : ''}" onclick="openClassroomVideo(${i}, '${returnTo}')">
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

function openClassroomVideo(idx, returnScreenId) {
	_classroomOpenIdx = idx;
	_classroomReturnScreen = returnScreenId || App.currentTab;
	const c = CLASSROOM_CHUNKS[idx];
	document.getElementById('video-title').textContent = c.title;
	document.getElementById('video-desc').textContent = c.desc;
	document.getElementById('video-duration').textContent = c.duration;
	hideTabBar();
	showScreen('video-overlay');
}

function closeClassroomVideo() {
	if (_classroomOpenIdx !== null) {
		App.classroomWatched.add(_classroomOpenIdx);
		_classroomOpenIdx = null;
	}
	checkPrepClassroomComplete();
	if (_classroomListEl) renderClassroomList(_classroomListEl, _classroomProgressEl, !!_classroomFilter);
	showScreen(_classroomReturnScreen);
	if (_classroomReturnScreen === 'prep-overlay') { showTabBar(); }
	else { goTab(App.currentTab); }
}

/* ==========================================================================
   PATTERNS — themed cards, engagement + tier gating, Discernment stub
   ========================================================================== */
function getAllQuotes() {
	return App.exercises.flatMap(e => e.quotes.map(q => Object.assign({}, q, { exId: e.id })));
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
			<button class="btn btn-dark btn-small" onclick="showStub('Upgrade to unlock Patterns', 'Patterns are part of Growth Edges or Circle access. This demo doesn\\'t include a working purchase flow.', 'Back', function(){ goTab(App.currentTab); })">Upgrade</button>
		</div>`;
		return;
	}
	const quotes = getAllQuotes();
	const byTheme = {};
	quotes.forEach(q => { (byTheme[q.theme] = byTheme[q.theme] || []).push(q); });
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
	el.innerHTML = cards + bridge;
}

/* -------------------------------------------------------------------------
   Past Exercises list (both tiers)
   ------------------------------------------------------------------------- */
function renderPastExercises(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	if (!App.exercises.length) {
		el.innerHTML = `<div class="empty-state">No exercises yet — start one above.</div>`;
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

function startPrepFlow() {
	hideTabBar();
	showScreen('prep-overlay');
	prepShowIntro();
}

function closePrepOverlay() {
	showTabBar();
	goTab(App.currentTab);
}

function prepOverlay(html) {
	document.getElementById('prep-overlay-body').innerHTML = html;
}

function prepShowIntro() {
	showTabBar();
	prepOverlay(`
		<button class="btn-ghost back-link" onclick="closePrepOverlay()">&larr; Back</button>
		<div class="h1" style="font-size:26px;margin-bottom:12px;">Getting ready for the Circle</div>
		<p class="body-text" style="margin-bottom:20px;">Session 1 is coming up. Before you gather with your group, take a few minutes on your own — a short class, an Attunement Exercise, and a moment to reflect on what you'll bring to the room.</p>
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
			<div><b style="font-size:16px;">Attunement Exercise</b><p class="caption" style="margin:0;">Complete your Attunement Exercise.</p></div>
		</div>
		<div class="card outlined prep-checklist-item" onclick="prepShowReflect()">
			<div class="chk-circle${App.prep.reflect ? ' done' : ''}">${App.prep.reflect ? '&#10003;' : ''}</div>
			<div><b style="font-size:16px;">Reflect &amp; Prep</b><p class="caption" style="margin:0;">One takeaway to bring to the group.</p></div>
		</div>
		${allDone && !App.prep.dismissed ? `<button class="btn btn-dark btn-block-mt" onclick="prepFinishSession1()">I've completed Session 1</button>` : ''}
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
		<div class="h1" style="font-size:26px;margin-bottom:6px;">Reflect &amp; Prepare</div>
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
	App.prep.dismissed = true;
	closePrepOverlay();
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
const SESSION1_TIMES = { arrival: [0, 15], breakouts: [15, 40], debrief: [40, 52], close: [52, 60] };
const SESSION1 = {
	id: 1, title: 'Session 1',
	sections: SECTION_ORDER.map(key => ({ id: key, name: SECTION_TEMPLATES[key].name, start: SESSION1_TIMES[key][0], end: SESSION1_TIMES[key][1], subs: SECTION_TEMPLATES[key].subs }))
};

function flattenPieces() {
	const flat = [];
	SESSION1.sections.forEach((sec, si) => sec.subs.forEach((sub, bi) => flat.push({ sec, sub, si, bi })));
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

function switchCardTab(btn, mode) {
	const card = btn.closest('.tab-card');
	card.querySelectorAll('.guide-mode-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	card.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.dataset.mode === mode ? 'block' : 'none');
}

function toggleFacNote() { document.getElementById('fac-note').classList.toggle('collapsed'); }

function renderConnectAgenda(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;
	el.innerHTML = `
		<div class="fac-note" id="fac-note">
			<div class="fac-note-header" onclick="toggleFacNote()">
				<span class="fac-note-icon">&#128161;</span>
				<span class="fac-note-title">${FAC_NOTE.title}</span>
				<span class="fac-note-chevron">&#9662;</span>
			</div>
			<div class="fac-note-body">${FAC_NOTE.body}</div>
		</div>
		<button class="start-live-btn" onclick="startFacilitatorMode()">&#9654; Start Facilitator Mode</button>
		${SESSION1.sections.map((sec, si) => `
			<div class="section-group">
				<div class="section-group-title"><span>${escapeHtml(sec.name)}</span><span>${sec.start}\u2013${sec.end} min</span></div>
				${sec.subs.map((sub, bi) => `
					<div class="guide-item" onclick="openGuidePiece(${si},${bi})">
						<div class="guide-num">${bi + 1}</div>
						<div class="guide-text"><div class="title">${escapeHtml(sub.title)}</div><div class="sub">${sub.readAloud ? 'Read aloud to the small group' : 'Facilitator instructions'}</div></div>
					</div>`).join('')}
			</div>`).join('')}`;
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
function closeGuidePiece() { goTab('connect'); }

let liveSectionIdx = 0, liveElapsedSeconds = 0, liveTimerInterval = null;

function startFacilitatorMode() {
	liveSectionIdx = 0;
	liveElapsedSeconds = 0;
	document.getElementById('live-session-label').textContent = `${SESSION1.title} \u00b7 Live Gathering`;
	renderLiveSection();
	updateLiveTimerDisplay();
	if (liveTimerInterval) clearInterval(liveTimerInterval);
	liveTimerInterval = setInterval(() => { liveElapsedSeconds++; updateLiveTimerDisplay(); }, 1000);
	hideTabBar();
	showScreen('guide-live-overlay');
}

function exitFacilitatorMode() {
	if (liveTimerInterval) { clearInterval(liveTimerInterval); liveTimerInterval = null; }
	goTab('connect');
}

function liveGoSection(idx) { liveSectionIdx = idx; renderLiveSection(); }
function liveNextSection() { if (liveSectionIdx < SESSION1.sections.length - 1) { liveSectionIdx++; renderLiveSection(); } }
function livePrevSection() { if (liveSectionIdx > 0) { liveSectionIdx--; renderLiveSection(); } }

function renderLiveSection() {
	const bar = document.getElementById('live-progress-bar');
	const labels = document.getElementById('live-progress-labels');
	bar.innerHTML = SESSION1.sections.map((sec, i) => {
		const width = ((sec.end - sec.start) / 60 * 100).toFixed(2);
		const state = i < liveSectionIdx ? 'done' : i === liveSectionIdx ? 'current' : 'upcoming';
		return `<div class="live-seg ${state}" style="width:${width}%" onclick="liveGoSection(${i})"></div>`;
	}).join('');
	labels.innerHTML = SESSION1.sections.map((sec, i) => {
		const width = ((sec.end - sec.start) / 60 * 100).toFixed(2);
		const state = i < liveSectionIdx ? 'done' : i === liveSectionIdx ? 'current' : 'upcoming';
		return `<div class="live-seg-label ${state}" style="width:${width}%">${sec.start}-${sec.end}</div>`;
	}).join('');
	const sec = SESSION1.sections[liveSectionIdx];
	document.getElementById('live-current-name').textContent = sec.name;
	const countText = sec.subs.length > 1 ? ` \u00b7 ${sec.subs.length} parts` : '';
	document.getElementById('live-current-meta').textContent = `min ${sec.start}-${sec.end}${countText}`;
	document.getElementById('live-cards').innerHTML = sec.subs.map((sub, bi) => renderTabCard(sub, `live-${liveSectionIdx}-${bi}`)).join('');
	document.querySelector('#guide-live-overlay .live-prev').disabled = liveSectionIdx === 0;
	document.querySelector('#guide-live-overlay .live-next').disabled = liveSectionIdx === SESSION1.sections.length - 1;
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
