# How Mochi talks: the conversation guide

Mochi is a companion, **not** a therapist. It never claims to be one, diagnoses, or gives medical advice. It borrows *how* trained helpers talk, because those habits are what make people feel understood. Every line is still pre-written (`content/dialogue.csv`). The on-device AI is only used to understand what the person says, the same split rule-based mental-health chatbots like Woebot use.

## The research it is based on

| Practice | What it says | How Mochi uses it |
|---|---|---|
| **Motivational interviewing, OARS** ([ISSUP](https://www.issup.net/node/5871), [Ohio EBP](https://ebp.drc.ohio.gov/EBP/motivationalinterviewing/OARSOpenEndedQuestionExamples), [Connecticut Children's](https://www.connecticutchildrens.org/sites/default/files/2025-04/motivational_interviewing_using_oars.pdf)) | **O**pen questions, **A**ffirmations, **R**eflections, **S**ummaries. Reflections are statements ("It sounds like…"), not questions. Ask fewer questions and never three in a row. Affirmations must be genuine. Summaries collect what was said and check it. | Every reply starts with a reflection. At most two questions in a row. After a few turns the cat summarises ("So if I've got it right…") and asks if it got it right. Effort gets a real affirmation. |
| **Validation, Linehan's six levels** ([Psychotherapy Academy](https://psychotherapyacademy.org/?p=25526), [Mentalyc worksheet](https://www.mentalyc.com/worksheets-and-cheatsheets/levels-of-validation-worksheet)) | Pay attention, reflect accurately, name the unspoken feeling, explain it by context ("No wonder, after…"), normalise ("Anyone would…"), be genuine. | Reflection → context validation ("No wonder you're exhausted, with work like that") → normalising. The cat names a feeling *tentatively* and lets you correct it. |
| **Person-centred listening** (Rogers) | Empathy, warmth, no judgement, the person leads. | No "you should", no fixing, no toxic positivity, no promises that everything will be fine. "Just sit with me" is always an option. |
| **Psychological First Aid: Look, Listen, Link** ([WHO pocket guide](https://www.crs.org/sites/default/files/ho_2.10_who_psychological_first_aid_pocket_guide.pdf)) | Stay close, don't pressure people to talk, listen if they want to, link them to support. | "I don't know" and short answers are accepted gently. The cat links to real people (helplines, a trusted friend) when it matters. |
| **Behavioural activation** ([NHS Scotland Matrix](https://www.matrix.nhs.scot/explore-the-recommended-interventions-therapies/behavioural-activation/), [UW training](https://bhss-wa.psychiatry.uw.edu/wp-content/uploads/2025/08/MC7D-Behavioral-Activation.pdf)) | Small, graded, pleasant or meaningful activities help with low mood. Start easy, because low energy makes activities feel too costly. | `src/brain/coach.js` suggests one small activity that fits your energy, mood, topic and time of day, explains *why*, and always offers "something else" or "just keep talking". |
| **Grounding and slow breathing** ([therapist.com](https://therapist.com/disorders/anxiety/grounding-techniques-for-anxiety/)) | 5-4-3-2-1 grounding is a practical tool with limited direct trial evidence. Slow breathing is widely used. | Offered as "might help", for stress and panic, never as a cure. |
| **Rule-based empathic agents** ([IEEE Spectrum on Woebot](https://spectrum.ieee.org/woebot/disclaimers), [JMIR 2024 review](https://mental.jmir.org/2024/1/e58974/PDF)) | Scripted lines written by people trained in evidence-based approaches avoid erratic replies. Pure keyword matching can feel shallow. | Lines are combined from several layers (reflection + validation + question or offer), react to the life area (work, school, family…), intensity and duration, and remember the session. |

## The rules every line follows

1. **Reflect before anything else.** Start with what the person said, in their own feeling word.
2. **Validate.** The feeling makes sense, given what is going on.
3. **One question at a time**, open ("What's been taking the most energy?"), never three in a row.
4. **Offer, never order.** "Would it help to…?" plus "something else" and "just keep talking".
5. **Short and warm.** At most two sentences, plain English, light cat-isms, and no jokes after something heavy.
6. **Never:** "you should", "cheer up", "everything will be fine", "at least…", diagnosis, medical advice, or being "the one who fixes it".
7. **Safety first, always.** Crisis phrases go to the help panel before any of this runs (`src/brain/safety.js`).
8. **Memory stays in memory.** What was said this session shapes replies and is forgotten when the app closes.
