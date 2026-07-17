# readIQ — Demo Video Script (Scene Format)

**Runtime target:** ~2:30 · **Format:** screen recording + voiceover
**Legend:** 🎬 **ON SCREEN** = what to show/tap · 🎙️ **VOICEOVER** = read this word-for-word · 💬 **LOWER-THIRD** = optional caption

---

## SCENE 1 — COLD OPEN · App icon / Home
**[0:00 – 0:15]**

🎬 **ON SCREEN**
App launches to the **Home** dashboard. Slow, calm.

🎙️ **VOICEOVER**
> "This is **readIQ** — an AI study companion that answers only from a student's *own*
> notes, and proves it. Everything intelligent it does runs through the **BTL Runtime** —
> chat, quizzes, reading photos and PDFs, and the search that keeps every answer honest.
> Let me show you where BTL runs."

💬 **LOWER-THIRD** — `readIQ · powered by the BTL Runtime`

---

## SCENE 2 — SCAN A PAGE · Add → Scan
**[0:15 – 0:40]**

🎬 **ON SCREEN**
Tap **＋** → **Scan**. Point at a printed or handwritten page → capture. Extracted text
appears. Tap **Save**.

🎙️ **VOICEOVER**
> "First, I'll add a note by **photographing a page** — this even works on handwriting.
> The photo goes to a **vision model on the BTL runtime**, and it reads the text right off
> the image into a clean, saved note."

💬 **LOWER-THIRD** — `BTL · POST /v1/chat/completions (vision) · gemini-2.5-flash`

---

## SCENE 3 — RECORD A LECTURE · Add → Record
**[0:40 – 1:05]**

🎬 **ON SCREEN**
Tap **＋** → **Record**. Live waveform + timer. Stop → transcript appears → summary → **Save**.

🎙️ **VOICEOVER**
> "Now a **lecture recording** — and here I'll be honest with you. BTL can't transcribe
> audio; we tested it and proved it. So the audio-to-text step uses **Groq's free Whisper** —
> but the second we have a transcript, the **summary comes straight back to BTL**. Even the
> one feature that leaves BTL comes right back to it."

💬 **LOWER-THIRD** — `Groq Whisper → summary on BTL · btl-2`

---

## SCENE 4 — THE MEMORY · Memory tab
**[1:05 – 1:20]**

🎬 **ON SCREEN**
Open **Memory** tab. Scroll the note cards — source badges (PHOTO / VOICE / PASTED / FILE).

🎙️ **VOICEOVER**
> "This is the **Memory Panel** — every note the app has saved, always visible. Each one was
> embedded the moment it saved, so readIQ can search them by *meaning*, not just keywords.
> That's what makes the next screen trustworthy."

💬 **LOWER-THIRD** — `BTL · POST /v1/embeddings · text-embedding-3-small`

---

## SCENE 5 — THE STAR · Ask AI tab ★
**[1:20 – 2:00]** *(the money shot — linger here)*

🎬 **ON SCREEN**
Open **Ask AI**. Type a question the notes cover. Answer **streams in live**. Zoom on the
**📌 From your notes** tag → tap it → the source note opens.

🎙️ **VOICEOVER**
> "This is the heart of readIQ. I ask a question, and the answer **streams in live** — that's
> BTL streaming, token by token. But look underneath — **'From your notes'**, with the exact
> note it came from. Tap it… and there's the real note. The app *cannot* answer unless it
> found a real note first."

🎬 **ON SCREEN**
Ask something the notes *don't* cover → the honest fallback → tap **"Answer from outside your
notes"** → a labelled answer with a **References** list.

🎙️ **VOICEOVER**
> "And when my notes *don't* cover something, it doesn't pretend — it says so. If I choose to,
> it'll answer from general knowledge, but clearly labelled as *not* from my notes, with real
> references. The student stays in control."

💬 **LOWER-THIRD** — `BTL · chat/completions (streamed) · btl-2 — gated by embeddings`

---

## SCENE 6 — QUIZ FROM YOUR NOTES · Quiz
**[2:00 – 2:20]**

🎬 **ON SCREEN**
Open **Quiz** → pick a subject → questions generate → answer one → green/red feedback →
a miss reveals the correct answer + a short "why".

🎙️ **VOICEOVER**
> "readIQ also turns those same notes into a **quiz** — grounded only in the student's own
> material, every question tagged to its source. Instant feedback, and on a miss it shows the
> right answer and *why*. The results feed the weak-topics tracker on Home."

💬 **LOWER-THIRD** — `BTL · chat/completions (JSON) · btl-2`

---

## SCENE 7 — CLOSE · quick pan Home → Settings model picker
**[2:20 – 2:30]**

🎬 **ON SCREEN**
Flash the **Settings → AI Model** picker, then rest on **Home**.

🎙️ **VOICEOVER**
> "So — **chat, vision, and embeddings**, all through the BTL runtime, from one scoped key in
> one file. The only thing off BTL is audio — because we proved it had to be. And every answer
> the student sees comes from a real note. That's **readIQ**."

💬 **LOWER-THIRD** — `BTL endpoints: /v1/chat/completions · /v1/embeddings · /v1/models`

---

## END CARD
**[hold 2 sec]**

🎬 **ON SCREEN** — readIQ logo
💬 **CAPTION** —
`readIQ — answers only from your notes.`
`BTL Runtime: btl-2 · gemini-2.5-flash · text-embedding-3-small`

---

### Optional add-on scene (drop in after Scene 6 if you have room)

## SCENE 6.5 — BROADCAST · Note → Listen
**[+0:15]**

🎬 **ON SCREEN**
Open any note → **Listen** → a two-host conversation plays.

🎙️ **VOICEOVER**
> "One more — any note can become a **two-host podcast**, written by BTL and grounded only in
> that note, played aloud on the device."

💬 **LOWER-THIRD** — `BTL · chat/completions · btl-2`

---

### Recording notes
- **Voiceover:** read the 🎙️ lines only — everything else is for you, not the mic.
- **Pace:** ~2.5 words/second is calm and clear. The full VO above is ~330 words ≈ 2:10 spoken,
  leaving headroom for taps and pauses.
- **The one scene that wins:** Scene 5 (Ask ★). If anything runs long, trim Scenes 3 or 6.5 — never Scene 5.
- **Lower-thirds** are optional but they *show* the BTL endpoints while you talk — worth the effort for the 30-pt runtime score.
