# Design Updates — Tactical Checklist

Concrete, screen-level changes to make in this prototype, pulled from three rounds of user research. Rationale/quotes live in `research/Findings-Themes-Takeaways.md` and `research/Rolling Synthesis.md` in the `attune-app` research repo — this doc is the "do it" list, that one is the "why." Check items off as we ship them; add new ones as research surfaces more. Screen IDs reference the map in `CONTEXT.md`.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Onboarding (flow1.html, `s1`–`s4`)

- [ ] Move "What is Attune" + a short Holy-Spirit-partnership disclaimer to the very first intro screen(s), ahead of everything else. Near-literal copy to test: *"Attune is a tool to help facilitate discernment, in partnership with the Holy Spirit — not a replacement for it."*
- [ ] Sequence the rest of intro content as: (1) spiritual/theological alignment → (2) what Attune actually is → (3) what you'll be asked to do. Audit current `s1`–`s3` order against this.
- [ ] Reframe at least one intro screen as a "Taste of Attune" guided walkthrough (a short guided mini-experience), not another conceptual explainer video — this substitutes for the in-person "taste" most real Greenhouse participants already have before going solo.
- [ ] Do not branch onboarding copy/flow by referred-vs-cold-user — keep one flow designed for someone who knows nothing.
- [ ] Add a plain-language free-vs-paid statement early in onboarding (before `s5`), not just at the purchase screen. Test copy: *"Personal Practice is free. Circle Experience is a paid upgrade."*

## Free home & Circle explainer (`s5`, `s5c`/`s5cv`, `s5p`)

- [ ] Replace/soften "Circle Experience" on first mention — either use plainer language or immediately follow it with a one-line plain definition. Don't let it sit undefined ("I don't know what that means, therefore then I get my ADD kicks in" — Round 3).
- [ ] Make the free/paid boundary visually explicit on `s5` itself — a small persistent label or badge on Personal Practice ("Free") vs. Circle Experience ("Upgrade"), not something you only learn by tapping in.
- [ ] Add a light credibility/roots section to `s5c` — brief, high-level mention of the method's grounding (spiritual formation + a nod to supporting research), not just a testimonial.
- [ ] Add a "community stories" surface (plural, categorized by use-case — personal / team / speaking, etc.) — design as a growing collection, not a single hero-story screen.

## Prep checklist → classroom → warm-up → exercise → reflect (`s6`–`s10`)

- [ ] **Classroom needs a free, standalone entry point (corrected Aug 11, 2026).** `s7` (Classroom) is currently only reachable via the paid/`hasCircle`-gated prep checklist (`s6` → `s7`). Classroom content itself should always be accessible, even to a free/no-context user with no purchase and no code — add an entry point (e.g. from the free home `s5` or the app-nav) that opens the same Classroom content standalone, no gathering attached. Only the *bundled checklist* framing tied to a specific Live Gathering stays gated behind Session Prep, not the content itself.
- [ ] Warm-up (`s8w`): change Listen/Read toggle to allow simultaneous read + listen, not either/or.
- [ ] Add an explicit on-screen privacy statement at the warm-up or exercise step (`s8w`/`s8`) and again at Reflect & Prepare (`s9`): *"What you share here is private. Your facilitator can't see it — you choose what to share in your gathering."* Write it so a facilitator could screenshot/forward it to their group as reassurance.
- [ ] Define "session" and "prep" on first use with a one-line explainer (e.g. a small inline tooltip or subhead under "Session 1 of 4") rather than assuming the terms are self-evident.
- [ ] Consider a first-time-only variant for session 1's *first* solo exercise specifically (not a redesign of all 4 sessions) — Julie's "this feels heavy" objection was scoped narrowly to that one moment.

## Facilitator Guide (`s5g`, flow3)

- [ ] **Scope the guide-outline teaser correctly (corrected Aug 10, 2026) — do not show it to the generic no-context/stranger flow.** Round 3's "show an outline teaser instead of a full paywall" finding came from Scott evaluating specifically as a would-be Wayfinder/organizer, not as a cold stranger. A person with no code who just found the app should see **zero** Circle/Facilitator Guide content — not even an outline. That flow's goal is exercises now, then discovering a real Circle (`Pricing-Packaging-Decision.md`), not a preview of what Circle contains. The outline-teaser idea only applies to a separate, not-yet-designed entry point for someone with actual organizing/leading intent (e.g. a pastor deciding whether to bring Circle to their group) — build that as its own path, don't surface it from the general free home.
- [ ] Drop the "buy a workbook for your study group" framing if it appears anywhere in copy — it didn't land in testing and isn't a validated positioning frame.

## Growth Map / Patterns (flow2.html)

- [ ] Standardize on one term for this feature across every screen — pick from Patterns / Growth Map / Heat Map, retire the other two. (Design-insights.md's "Growth Edges" naming for the discernment exercise itself should stay distinct from whatever we pick here.)
- [ ] Add an explicit bridge/CTA from a shown pattern to the actual Discernment of Growth Edges exercise — right now a pattern can read as inert information with no next step.
- [ ] Rewrite any AI/theme copy to read as "your own words, organized" — avoid language implying interpretation, diagnosis, or external framing.
- [ ] Protect the "dated quotes as evidence under each theme" pattern already in the design — it's the most concretely-loved detail across all three research rounds. Don't simplify it away.
- [ ] Design exploration: surface at least one outlier/less-common theme alongside the consolidated common ones, so the screen doesn't only amplify the loudest pattern.
- [ ] Open product decision to make explicitly (not default silently): does personalization mean serving more *content* on a detected theme, adapting the *exercise/interface* itself, or both?

## Cross-cutting / not yet screen-specific

- [ ] Decide and document: what does the app offer someone with zero existing Circle/community around them? ("Discover a Circle" — a local-group finder — is the leading candidate; not yet prototyped.)
- [ ] Audit overall pacing/transitions against "should feel unhurried, not app-task-y" — this is a tone note more than a specific screen fix; revisit once real audio/voice exists.
- [ ] When real client copy is available, replace the illustrative Arrival/Debrief/Close facilitator-guide content (already flagged in `CONTEXT.md`).

---

## Done

*(move items here as they ship, with the commit/date if useful)*
