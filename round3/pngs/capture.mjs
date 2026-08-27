import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:8766/round3';

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: true,
	args: ['--hide-scrollbars']
});
const page = await browser.newPage();
await page.setViewport({ width: 520, height: 1100, deviceScaleFactor: 2 });

async function shot(name) {
	await new Promise(r => setTimeout(r, 160));
	const frame = await page.$('.phone-frame');
	if (!frame) {
		await page.screenshot({ path: join(OUT, `${name}.png`), type: 'png' });
	} else {
		await frame.screenshot({ path: join(OUT, `${name}.png`), type: 'png' });
	}
	console.log(name);
}

async function load(file) {
	await page.goto(`${BASE}/${file}`, { waitUntil: 'networkidle0' });
	await page.evaluate(() => document.fonts.ready);
	await new Promise(r => setTimeout(r, 200));
}

async function evalp(fn, ...args) {
	return page.evaluate(fn, ...args);
}

/* -------------------------------------------------------------------------
   Landing
   ------------------------------------------------------------------------- */
await load('index.html');
await shot('00-landing');

/* -------------------------------------------------------------------------
   Paid + Circle — onboarding
   ------------------------------------------------------------------------- */
await load('paid-circle.html');
await shot('01-paid-intro-1-attunement');
await evalp(() => showScreen('ob-intro-2'));
await shot('02-paid-intro-2-why');
await evalp(() => showScreen('ob-intro-3'));
await shot('03-paid-intro-3-what-is-attune');
await evalp(() => showScreen('ob-intro-4'));
await shot('04-paid-intro-4-circle');
await evalp(() => showScreen('ob-account'));
await shot('05-paid-create-account');
await evalp(() => showScreen('ob-name'));
await shot('06-paid-name');
await evalp(() => showScreen('ob-path'));
await shot('07-paid-path');
await evalp(() => showScreen('ob-circle-join'));
await shot('08-paid-join-circle');

await evalp(() => finishOnboarding());
await shot('09-paid-home-prep');
await page.click('.prep-card-head .session-menu-btn');
await shot('10-paid-home-prep-menu');
await evalp(() => closeSessionMenu());

await evalp(() => startPrepFlow());
await shot('11-paid-prep-intro');
await evalp(() => prepShowChecklist());
await shot('12-paid-prep-checklist');
await evalp(() => prepShowClassroom());
await shot('13-paid-prep-learning');
await evalp(() => prepShowReflect());
await shot('14-paid-prep-reflect');
await evalp(() => closePrepOverlay());

await evalp(() => goTab('connect'));
await shot('15-paid-circle-hub');
await evalp(() => openCircleOverview());
await shot('16-paid-circle-overview-video');
await evalp(() => {
	if (typeof _videoObserver !== 'undefined' && _videoObserver) {
		_videoObserver.disconnect();
		_videoObserver = null;
	}
	goTab('connect');
});
await evalp(() => openConnectSession(0));
await shot('17-paid-session-1');
await evalp(() => togglePrepStack());
await shot('18-paid-session-1-prep-collapsed');
await evalp(() => togglePrepStack());
await page.click('.session-title-row .session-menu-btn');
await shot('19-paid-session-menu');
await evalp(() => closeSessionMenu());
await evalp(() => openGuidePiece(0, 0));
await shot('20-paid-guide-piece');
await evalp(() => closeGuidePiece());
await evalp(() => startFacilitatorMode());
await shot('21-paid-facilitator-live');
await evalp(() => exitFacilitatorMode());

await evalp(() => goTab('home'));
await evalp(() => startCoachTour());
await shot('22-paid-coach-tour');
await evalp(() => skipCoachTour());

await evalp(() => goTab('profile'));
await shot('23-paid-profile');
for (const id of ['name', 'email', 'password', 'settings', 'faqs', 'help', 'ai', 'privacy']) {
	await evalp((pageId) => openProfilePage(pageId), id);
	await shot(`24-paid-profile-${id}`);
}
await evalp(() => openSettings());

/* -------------------------------------------------------------------------
   Personal exercise flow (from paid home)
   ------------------------------------------------------------------------- */
await evalp(() => {
	goTab('home');
	startExercise({ returnTab: 'home' });
});
await shot('30-ex-privacy');
await evalp(() => showAIInfo('exercise-overlay', renderExercisePrivacy));
await shot('31-ex-ai-info');
await evalp(() => renderExercisePrivacy());
await evalp(() => renderExerciseWarmup());
await shot('32-ex-warmup');
await evalp(() => setWarmupMode('audio'));
await shot('33-ex-warmup-audio');
await evalp(() => setWarmupMode('words'));
await shot('34-ex-warmup-words');
await evalp(() => setWarmupMode('both'));
await shot('35-ex-warmup-both');

const stepSlugs = [
	'name-situation',
	'self-good',
	'self-broken',
	'choose-other',
	'other-good',
	'other-bad',
	'choose-nonhuman',
	'nonhuman-good',
	'nonhuman-broken',
	'resonating'
];
for (let i = 0; i < stepSlugs.length; i++) {
	await evalp((idx) => renderExerciseStep(idx), i);
	await shot(`36-ex-step-${String(i + 1).padStart(2, '0')}-${stepSlugs[i]}`);
}
await evalp(() => skipThink());
await shot('37-ex-step-ready-to-type');
await evalp(() => {
	ex.responses = EXERCISE_STEPS.map((s, i) => ({
		label: s.label,
		text: i === 0 ? 'A conversation that stayed with me after I left the room.' : 'Placeholder response for this export.',
		mode: 'type'
	}));
	renderExerciseOutput();
});
await shot('38-ex-recap');
await evalp(() => renderExerciseRating());
await shot('39-ex-rating');
await evalp(() => setRating(4));
await shot('40-ex-rating-filled');
await evalp(() => cancelExercise());

/* -------------------------------------------------------------------------
   Exercises tab states
   ------------------------------------------------------------------------- */
await load('paid-circle.html?start=exercise&ex=empty');
await shot('50-ex-tab-empty');

await load('paid-circle.html?start=exercise&ex=few');
await shot('51-ex-tab-few');
await evalp(() => openPastRecap(App.exercises[0].id));
await shot('52-ex-past-recap');
await evalp(() => closePastRecap());

await load('paid-circle.html?start=exercise&ex=ready');
await shot('53-ex-tab-ready');
await evalp(() => {
	const sc = document.getElementById('exercise');
	if (sc) sc.scrollTop = sc.scrollHeight;
});
await shot('54-ex-tab-ready-scroll');
await evalp(() => {
	const sc = document.getElementById('exercise');
	if (sc) sc.scrollTop = 0;
});
await evalp(() => openExerciseFab());
await shot('55-ex-tab-ready-fab');
await evalp(() => closeExerciseFab());
await evalp(() => startDGE());
await shot('56-dge-intro');
await evalp(() => renderDgeRange());
await shot('57-dge-range');
await evalp(() => selectDgeRange('custom'));
await shot('58-dge-range-custom');
await evalp(() => selectDgeRange('since'));
await evalp(() => renderDgeThemes());
await shot('59-dge-themes');
await evalp(() => renderDgeEdges());
await shot('60-dge-edges');
await evalp(() => cancelDGE());

await load('paid-circle.html?start=exercise&ex=after');
await shot('61-ex-tab-after');
await evalp(() => {
	const sc = document.getElementById('exercise');
	if (sc) sc.scrollTop = sc.scrollHeight;
});
await shot('62-ex-tab-after-scroll');
await evalp(() => {
	const sc = document.getElementById('exercise');
	if (sc) sc.scrollTop = 0;
});
await evalp(() => openExerciseFab());
await shot('63-ex-tab-after-fab');
await evalp(() => closeExerciseFab());
await evalp(() => editGrowthEdges(0));
await shot('64-ex-edit-growth-edges');
await evalp(() => cancelDGE());

await evalp(() => {
	goTab('home');
	markSessionCompleted(0);
});
await shot('65-paid-home-after-session');

await evalp(() => {
	goTab('home');
	const item = (typeof CLASSROOM_CHUNKS !== 'undefined' && CLASSROOM_CHUNKS[0]) ? CLASSROOM_CHUNKS[0] : null;
	if (item) openReading({ title: item.title, duration: item.duration, desc: item.desc, badge: 'Learning' }, 'home');
});
await shot('66-paid-reading');
await evalp(() => closeReading());

/* -------------------------------------------------------------------------
   Free / not in a Circle
   ------------------------------------------------------------------------- */
await load('free.html');
await shot('70-free-intro-1');
await evalp(() => showScreen('ob-intro-2'));
await shot('71-free-intro-2');
await evalp(() => showScreen('ob-path'));
await shot('72-free-path');
await evalp(() => finishOnboarding());
await shot('73-free-home');
await evalp(() => goTab('exercise'));
await shot('74-free-exercise');
await evalp(() => goTab('connect'));
await shot('75-free-circle');
await evalp(() => showScreen('find-a-circle'));
await shot('76-free-find-a-circle');
await evalp(() => goTab('profile'));
await shot('77-free-profile');

await load('free.html?start=exercise&ex=ready');
await evalp(() => goTab('exercise'));
await shot('78-free-exercise-3plus');

await browser.close();
console.log('done', OUT);
