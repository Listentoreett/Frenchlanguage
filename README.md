# French Learning Plan

A local-first French speaking and listening plan for daily life, job search, and professional conversations in France.

The course is realistic about pronunciation: browser text-to-speech is useful for repetition, but native-level pronunciation should be checked against IPA notes, your own recordings, and free-licensed human recordings when available.

## Start The Pronunciation Coach

Windows PowerShell:

```powershell
.\scripts\serve.ps1
```

macOS or Linux:

```bash
sh scripts/serve.sh
```

Then open:

```text
http://127.0.0.1:5173/app/pronunciation-coach/
```

You can also open [app/pronunciation-coach/index.html](app/pronunciation-coach/index.html) directly, but microphone recording works more reliably from `localhost`.

## Course Structure

- [Course plan](course/learning-plan.md)
- [Pronunciation guide](course/pronunciation-guide.md)
- [Speaking and listening plan](course/listening-speaking-plan.md)
- [Free audio sources and licensing](course/free-audio-sources.md)
- [Week 1 lesson](course/lessons/week-01-survival.md)
- [Week 2 lesson](course/lessons/week-02-daily-life-workplace.md)
- [Week 3 lesson](course/lessons/week-03-job-search-interviews.md)
- [Week 4 lesson](course/lessons/week-04-professional-french.md)
- [Exercises](course/exercises/)
- [Tests](course/tests/)
- [Tutor prompts](prompts/codex-study-prompts.md)

## Design Choices

- UTF-8 French text with accents fixed.
- No Google Translate audio URLs or paid/CDN dependencies.
- Static browser app with feature detection for Chrome, Edge, Safari, and Firefox.
- Optional speech recognition only where supported; recording and self-review are always the main practice path.
- Audio folder and attribution manifest ready for Wikimedia Commons, Lingua Libre, Common Voice, or your own recordings.

## Optional Free Audio

The app works without downloaded audio. To fetch the vetted Wikimedia starter pronunciations when your network allows it:

```bash
npm run fetch-audio
```

Downloaded files go to `assets/audio/`, and attribution is written to `assets/audio/manifest.csv`.

## Daily Study Rhythm

- 20 minutes: pronunciation drills and shadowing.
- 25 minutes: listening and dictation.
- 35 minutes: grammar and sentence patterns.
- 30 minutes: speaking roleplay.
- 20 minutes: writing or review.

One month can build strong survival and job-search French. It will not make a beginner fully fluent, so the plan favors high-frequency phrases, accurate sounds, and repeatable speaking routines.
