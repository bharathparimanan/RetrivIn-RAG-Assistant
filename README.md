# RetrivIn

**AI-powered interview preparation platform built on Retrieval-Augmented Generation.**

RetrivIn ingests your documents — resume, job descriptions, study notes — and uses them to generate targeted interview questions grounded in your actual experience. Every question traces back to something you wrote. No generic question banks. No hallucinated feedback.

---

## What It Does

Upload your resume. Select a target role. RetrivIn retrieves the most semantically relevant chunks from your documents, assembles a grounded context window, and calls Claude to generate 10 interview questions that only a system that read your resume could ask.

Answer all 10. Submit. Get a report card with scores, weak areas, and recommendations.

---

## Three Modes

| Mode | Name | Purpose |
|------|------|---------|
| `trainer` | Learn | 10 grounded questions from your documents. Tests whether you understand what you claim to know. |
| `introspect` | Prepare | Exposes blind spots — questions you haven't prepared for but should have. |
| `retrospective` | Question | First-principles analysis of your actual experience. Forces the why behind every decision. |

---

## Architecture