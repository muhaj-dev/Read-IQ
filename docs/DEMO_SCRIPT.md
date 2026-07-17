# readIQ — Demo & Talk-Track Script

> A page-by-page speaking script for the BTL Runtime Hackathon demo.
> For each screen: **what you're looking at**, **say this** (read aloud), and
> **BTL runs here** (the exact endpoint + model to point at).
>
> The whole story is one sentence: **every answer readIQ gives comes from a real note,
> and almost every intelligent thing it does runs through the BTL Runtime.**

---

## 0 · The 20-second opener (say this first, before you touch the app)

> "This is **readIQ** — an AI study companion that only answers from a student's *own*
> notes, and proves it. Notes go in four ways — paste, upload, snap a photo, or record a
> lecture — and everything intelligent the app does runs through the **BTL Runtime**:
> the grounded chat, the quizzes, the note summaries, the PDF and photo reading, and the
> semantic search that keeps every answer honest. Let me show you where BTL runs."

---

## 1 · The "where BTL runs" map (keep this on screen while you talk, or just narrate it)

Every AI job in the app, the endpoint it calls, and the model behind it:

| # | Where in the app | What the AI does | BTL endpoint | Model |
|---|------------------|------------------|--------------|-------|
| 1 | **Ask AI** tab ★ | Grounded chat, **streamed** token-by-token | `POST /v1/chat/completions` (SSE) | `btl-2` |
| 2 | **Ask AI** — "beyond your notes" (opt-in) | General answer + a real References list | `POST /v1/chat/completions` | `btl-2` |
| 3 | **Ask AI** — attach a photo | Reads the image, answers, can save it as a note | `POST /v1/chat/completions` (vision) | `gemini-2.5-flash` |
| 4 | **Quiz** | Grounded multiple-choice questions as JSON | `POST /v1/chat/completions` (JSON) | `btl-2` |
| 5 | **Add → Scan** | Photo of a page → text (printed **and** handwriting) | `POST /v1/chat/completions` (vision) | `gemini-2.5-flash` |
| 6 | **Add → Upload** (PDF) | PDF → text | `POST /v1/chat/completions` (vision) | `gemini-2.5-flash` |
| 7 | **Add** (paste / upload / scan / record) | Summarize raw text into a clean note | `POST /v1/chat/completions` | `btl-2` |
| 8 | **Note → Listen** (Broadcast) | Turns one note into a two-host podcast script | `POST /v1/chat/completions` | `btl-2` |
| 9 | **Everywhere notes are saved or asked** | Semantic retrieval — the grounding gate | `POST /v1/embeddings` | `text-embedding-3-small` |
| 10 | App startup / Settings | Connectivity health check (no tokens spent) | `GET /v1/models` | — |

**Two things are deliberately NOT on BTL — be honest about them:**

- **Lecture transcription (Record):** BTL has no working audio path — we *proved* it live
  (`/v1/audio/transcriptions` 404s, `gpt-audio` 400s, `voxtral` fits only ~1 second of audio
  in its context). So Record uses **Groq's free Whisper** (`whisper-large-v3-turbo`) for the
  audio-to-text step only — then the transcript is **summarized back on `btl-2`**, so the
  intelligence stays on BTL.
- **.docx upload:** unzipped and read **on-device** (jszip) — no network, no credits.

> Say it out loud: *"Breadth and depth — five different BTL jobs across chat, vision, and
> embeddings, plus one honest exception for audio that we verified ourselves."*

---

## 2 · Onboarding (10 seconds — skip if you're tight on time)

**What you're looking at:** Welcome → About you → First note.

> "Quick onboarding — the student says what they're studying for, and the very first thing
> they do is add a note and watch it fly into their Memory. That 'it remembers me' moment is
> the whole promise."

**BTL runs here:** nothing yet — but the note they add is embedded the moment it saves (job #9).

---

## 3 · Home / Dashboard tab

**What you're looking at:** greeting + streak, stat cards (notes, AI answers, quiz score),
upcoming deadlines, weak topics, and the big **Ask** and **Generate Quiz** actions.

> "This is Home. Everything here is real data from the student's own activity — notes saved,
> questions answered, quiz scores, weak topics to review, and deadlines colour-coded by
> urgency. It's the 'what do I do next' screen. The two big buttons — **Ask** and
> **Generate Quiz** — both run on BTL, so let's use them."

**BTL runs here:** none directly — it's a dashboard. The numbers come from AI work done elsewhere.

---

## 4 · Add a note — Scan  *(hero moment — vision OCR)*

**What you're looking at:** the ＋ button → Scan → camera / pick a photo → it reads the page.

> "I'll add a note by **photographing a page** — this even works on handwriting. Watch —
> the photo goes up to a **vision model on the BTL runtime**, and it reads the text straight
> off the image into a clean, saveable note."

**BTL runs here:** `POST /v1/chat/completions` (vision) → **`gemini-2.5-flash`** — the photo is
sent as an `image_url` content part. Then the extracted text is summarized on **`btl-2`** (job #7).

---

## 5 · Add a note — Record  *(hero moment — the honest exception)*

**What you're looking at:** ＋ → Record → live waveform + timer → transcript → summary → save.

> "Now a **lecture recording**. Here's where I'm being honest with the judges: BTL couldn't
> transcribe audio — we tested three different paths and proved it. So the *audio-to-text*
> step runs through **Groq's free Whisper** — but the moment we have a transcript, the
> **summary comes straight back to BTL's `btl-2`**. So even the one feature that leaves BTL
> for a second comes right back to it for the intelligence."

**BTL runs here:** transcription on **Groq `whisper-large-v3-turbo`** (the one non-BTL step),
then summary on **`btl-2`** via `POST /v1/chat/completions`.

---

## 6 · Memory tab  *(the proof it remembers)*

**What you're looking at:** every saved note as a card — title, source badge
(PASTED / FILE / PHOTO / VOICE), date — with search.

> "This is the **Memory Panel** — every note the app has ever saved, always visible. This is
> the app's memory made literal. Each of these was embedded on save, so the app can search
> them by *meaning*, not just keywords — and that's what makes the next screen trustworthy."

**BTL runs here:** each note was embedded on save — `POST /v1/embeddings` →
**`text-embedding-3-small`** (job #9). This is the grounding gate being built up.

---

## 7 · Ask AI tab ★  *(THE star — spend the most time here)*

**What you're looking at:** the chat. Ask a question that's covered by a saved note.

> "This is the heart of readIQ. I ask a question, and the answer **streams in live** —
> that's BTL streaming token-by-token. But look underneath: **'📌 From your notes'** with the
> exact note it came from. Tap it — it opens the real note. The app *cannot* answer unless
> retrieval found a real note first. That's the trust mechanic: if nothing matches, it says
> so honestly instead of making something up."

**Then show the opt-in:**

> "And if my notes *don't* cover something, readIQ doesn't pretend. It offers a quiet
> **'Answer from outside your notes'** — and when I take it, the answer is clearly labelled as
> *not* from my notes and closes with a real References list. The student stays in control of
> when the app steps outside their material."

**Optionally show attach-a-photo:**

> "I can even attach a photo right in the chat — it reads the image and can save it as a note."

**BTL runs here (three jobs at once):**
- Grounded answer: `POST /v1/chat/completions` **streamed (SSE)** → **`btl-2`** (job #1)
- The grounding gate that ran *before* it: `POST /v1/embeddings` → **`text-embedding-3-small`** —
  it embeds the question, cosine-ranks note chunks, and **only calls the model if a chunk clears
  the similarity threshold** (job #9)
- Beyond-notes answer → **`btl-2`** (job #2); attached photo → **`gemini-2.5-flash`** vision (job #3)

---

## 8 · Quiz  *(grounded MCQs)*

**What you're looking at:** Quiz Home → pick a subject → generated questions → one per screen →
score + weak topics + "why" on each miss.

> "readIQ turns the student's *own* notes into a quiz. I pick a subject, and BTL generates
> multiple-choice questions **grounded only in the notes for that subject** — every question is
> tagged with its source. I answer, get instant green/red feedback, and on the ones I miss it
> shows the correct answer with a short 'why' — also grounded. The results feed the weak-topics
> tracker back on Home."

**BTL runs here:** `POST /v1/chat/completions` returning **JSON** → **`btl-2`** (job #4).
Questions are generated from retrieved note chunks and cached in SQLite so a retake is free.

---

## 9 · Note → Listen (Broadcast)  *(the creative flourish)*

**What you're looking at:** open any note → Listen → a two-host audio conversation about it.

> "One more — any note can become a **two-host podcast**. BTL writes a 'From Your Notes'
> conversation between two hosts, grounded only in that one note, and the app plays it aloud on
> the device. A long note gets split into ordered segments so the episode covers it end-to-end."

**BTL runs here:** `POST /v1/chat/completions` → **`btl-2`** (job #8), cached by content hash.

---

## 10 · Deadlines

**What you're looking at:** a month calendar with dotted due-dates + an upcoming list,
countdowns, urgency colours, reminder toggles.

> "Deadlines rounds out the study workflow — exam and assignment dates, colour-coded by how
> soon they are, with the soonest surfaced on Home. This part is all local — no AI needed, and
> that's fine; not everything should be an AI call."

**BTL runs here:** none — deliberately. Local SQLite only.

---

## 11 · Profile / Progress

**What you're looking at:** the same real stats — streak, AI answers, quiz performance,
study sessions, achievements.

> "Profile is the 'I'm improving over time' view — streaks, quiz performance, study sessions,
> achievements. All real, all earned from the work the student actually did."

**BTL runs here:** none directly — it reflects AI work done on the other screens.

---

## 12 · Settings → AI Model  *(prove the breadth of the gateway)*

**What you're looking at:** the model picker.

> "Last thing for the judges: because BTL is an OpenAI-compatible gateway with a huge catalog,
> the student can switch the chat model right here — `btl-2` by default, but any model behind the
> gateway. One thin client, one scoped key, read in exactly one file — `lib/btl.ts`. That's the
> whole AI layer."

**BTL runs here:** `GET /v1/models` powers the health check; the picker changes which model the
chat / quiz / summary / podcast calls use.

---

## 13 · The closing line (the submission field, said out loud)

> "So — to sum up the BTL usage: we route **chat, vision, and embeddings** through the runtime.
> **`btl-2`** does grounded streamed chat, quiz JSON, note and lecture summaries, and the podcast
> scripts. **`gemini-2.5-flash`** reads photos and PDFs. **`text-embedding-3-small`** powers the
> semantic search that gates every single answer. The only thing off BTL is audio transcription —
> because we *proved* BTL can't do it — and even then the summary comes right back to `btl-2`.
> That's breadth **and** depth, and every answer the student sees is provably from their own notes."

**Endpoints to name (submission field):**
`POST /v1/chat/completions` — streamed (grounded Ask ★) and non-streamed
(quiz JSON · note & lecture summary · podcast script · scan OCR & PDF extraction via
`gemini-2.5-flash` vision) · `POST /v1/embeddings` (`text-embedding-3-small`, semantic
retrieval) · `GET /v1/models` (health check).

---

## Tight 2-minute cut (if you only have 2 minutes)

Hit these five, in this order, and say one line each:

1. **Scan** (0:00–0:25) — "Photo of a page → text, via a **vision model on BTL** (`gemini-2.5-flash`)."
2. **Memory** (0:25–0:40) — "Every note, always visible — each one embedded on save (`text-embedding-3-small`)."
3. **Ask ★** (0:40–1:20) — "Streamed grounded answer, **📌 From your notes**, tap the source. Nothing matches → it says so. This is `btl-2` streaming, gated by embeddings." *(This is the money shot — linger here.)*
4. **Quiz** (1:20–1:45) — "Its own notes → grounded MCQs with a 'why' on each miss (`btl-2`, JSON)."
5. **Close** (1:45–2:00) — "Chat, vision, and embeddings, all through BTL. One honest exception — audio — proven and handled. Every answer comes from a real note."
