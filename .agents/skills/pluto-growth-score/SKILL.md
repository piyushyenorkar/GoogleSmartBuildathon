---
name: pluto-growth-score
description: Enforce deterministic student portfolio Growth Score calculations, tier badge assignments, verified event attendance synchronization, and Gemini AI reflection evaluation rules.
---

# Pluto Campus Growth Score & Portfolio Guardrails

This skill establishes the algorithmic rules, verification workflows, and AI reflection grading procedures for student portfolios and **Growth Scores** in **Pluto Campus**.

---

## 1. Growth Score Deterministic Formula

Student profiles feature a dynamic, gamified **Growth Score** that quantifies technical activity, hackathon participation, and academic engagement.

$$\text{Growth Score} = (S \times 5) + (P \times 20) + (E \times 8) + (C \times 10) + (H \times 2) + (I \times 2) + B$$

Where:
* $S$ = Number of validated technical skills (e.g., Python, React, PyTorch, Docker)
* $P$ = Published showcase projects with valid repositories/demos
* $E$ = Number of verified attended events/hackathons
* $C$ = Profile completeness index (scaled 0 to 1)
* $H$ = Extracurricular hobbies (soft skills & creative pursuits)
* $I$ = Technical interests and target career tracks
* $B$ = Cumulative AI reflection bonus points (capped per event)

---

## 2. Profile Completeness Index ($C$)

Profile completeness is computed on a 0.0 to 1.0 scale based on 5 weighted criteria (0.2 each):
1. **Avatar**: Profile picture or verified avatar uploaded.
2. **Bio & Headline**: Biographical summary containing at least 20 characters.
3. **Academic Affiliation**: Both `college_id` and `department` confirmed.
4. **Cohort Context**: Academic `year` (1–4) and `section` specified.
5. **Verified Socials**: At least one external profile connected (GitHub or LinkedIn).

---

## 3. Tier Rank Classification

Every student portfolio displays a real-time badge reflecting their Growth Score:

| Growth Score Range | Tier Badge | Display Label | Student Standing |
|:---:|:---:|:---:|:---|
| `< 100` | 🥉 Bronze | **Getting Started** | Exploring campus opportunities & building foundational profile |
| `100 – 299` | 🥈 Silver | **Rising Star** | Actively collaborating, attending events, and shipping projects |
| `≥ 300` | 🥇 Gold | **Top 10% · Gold** | Campus leader, verified hackathon builder, and high-demand teammate |

---

## 4. Verification Guardrails & Booking Sync

To maintain integrity and prevent artificial score inflation:

1. **Automatic Ticket Verification**:
   - `events_attended` cannot be incremented manually by users.
   - `syncBookings()` verifies confirmed ticket check-ins against `public.bookings` where:
     ```sql
     booking_status = 'confirmed' AND user_id = $1
     ```
2. **Project Validation**:
   - Each project entry in `public.projects` MUST include:
     - `title` (minimum 3 characters)
     - `description` (minimum 20 characters)
     - Valid `github_url` or live `demo_url`

---

## 5. Gemini AI Event Reflection & Bonus Points

Students can submit self-reflection journals for attended events to deepen learning and earn bonus points:

1. **Evaluation Endpoint**: Evaluated via `POST /api/ai/evaluate` powered by **Google Gemini 2.5 Flash**.
2. **Grading Criteria**:
   - **Technical Depth**: Did the student articulate tools, architectures, or frameworks used?
   - **Problem Solving**: Did they reflect on debugging, challenges, or architectural trade-offs?
   - **Future Application**: How will the learnings be applied in future hackathons or research?
3. **Scoring Bounds**:
   - Output `bonus_points`: Integer from **1 to 5** (strictly capped at +5 per event).
   - Output `ai_insight`: 2-3 sentences of constructive mentorship and recommended next topics.
4. **Prompt Format Requirement**:
   Gemini evaluation calls must request structured JSON format:
   ```json
   {
     "bonusPoints": 4,
     "aiInsight": "Clear breakdown of WebGL shader optimizations during the hackathon. Recommended next step: explore WebGPU compute shaders."
   }
   ```
