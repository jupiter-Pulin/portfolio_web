---
title: Why Everyone Will Become a Product Engineer
summary: AI made building cheap, so the hard question moved from “Can this be built?” to “Should it be built?” That changes what PMs, engineers and everyone in between need to be good at.
tags: [ai, product, career]
---

For a long time, a lot of product work started with the same slightly nervous question:

> “Um… can this be built?”

A PM would bring an idea to an engineer, and the answer usually depended on the sprint.

![A PM holding a spec asks an engineer at a desk “Um… can this be built?” The engineer answers “Sprint’s full.”](can-this-be-built.webp "The old question, and the usual answer.")

I recently made a two-minute hand-drawn animation about how that question is changing. These frames are from it, along with the argument behind them.

**Back then, a PM was more of a dispatcher.** Deals and specs came in from the client upstream; tickets and sprint slots went out to engineers downstream. The PM sat in the middle and kept the queue moving.

![A client, a PM and an engineer in a row. Arrows labelled “Deals & specs” and “Tickets & sprints” pass documents through the PM, who is labelled “Dispatcher!”](pm-as-dispatcher.webp "Deals and specs in, tickets and sprints out.")

Why split the work up like this? Because building things was expensive. **The division of labor was really a product of cost.** When an engineer’s week is the scarcest thing in the building, you put people in front of it to decide what gets in.

That setup has a price. Every handoff distorts the idea a little more. The client imagines a star, the PM writes it down, the engineer builds what the ticket says, and the client gets a circle.

![The client, now angry, says “That’s not what I asked for!” The PM is sweating; the engineer is thinking of a circle.](not-what-i-asked-for.webp "They asked for a star. They got a circle.")

**Then AI showed up.** Pages, APIs, the textbook boilerplate we all memorized: AI writes them in minutes. Building got cheap, almost overnight.

When building is cheap, the bottleneck moves. It is no longer *can we build it?* It is *should we?* and *what should it be?* That shift quietly changes who is valuable: the people closest to users, who actually know what is needed, matter more than before.

![A robot beside a bottle labelled bottleneck. “Can we build it?” is crossed out and replaced by “Should we?” and “What should it be?”, under a row of light bulbs and the words “Ideas are worth more!”](the-bottleneck-moves.webp "The bottleneck moves from building to deciding.")

**So can we just let go and hand everything to AI? That is dead wrong.**

AI writes code that runs. What it can’t tell you is where that code will break: concurrency, permissions, edge cases, cost, and how anyone will debug it when it fails. Those are exactly the parts a demo never shows.

![A robot next to a wobbly tower of code blocks marked “It runs!”, with cracks labelled concurrency, permissions, edge cases, cost and debugging.](it-runs.webp "It runs. That’s not the same as right.")

The split I keep coming back to is simple:

> AI makes it run. You make it right.

**So the future you is part PM, part system architect.** You define every interaction, and you understand the whole architecture you are serving, not just your layer of it.

That is different from being full-stack. Full-stack spreads wide across the tech stack: front end, back end, database. A product engineer goes end to end: from the problem, through the interaction and the architecture, to launch and the feedback that starts the next loop. One person, one loop.

![Left: “Full-stack” as front-end, back-end and database side by side, spread wide. Right: “Product engineer” as a vertical loop from problem to interaction, architecture, launch and feedback, marked “End to end”.](full-stack-vs-product-engineer.webp "Full-stack spreads wide. A product engineer goes end to end.")

**The skills worth building shift with it:**

- **Frame the problem:** decide what is worth solving before anything gets built.
- **Product taste:** judge an interaction the way a user will feel it.
- **System view:** know how the pieces fit, fail and cost money.
- **Review and verify:** check what AI produced instead of trusting that it runs.

Reading code now matters more than writing it. When most of the code is generated, the valuable skill is reading it, questioning it and deciding whether it should ship.

![A clipboard titled “Skill checklist” with frame the problem, product taste, system view and review & verify all ticked, next to a magnifying glass over a page of code and the line “Reading code > writing code”.](skill-checklist.webp "Reading code now matters more than writing it.")

None of this means everyone becomes the same kind of person. PMs, designers and engineers will still have their own depth. What changes is the baseline: everyone is expected to cover more of the loop than before.

We used to ask:

> “Can this be built?”

From now on, everyone has to ask:

> “Should this be built?”

![The speech bubble from the opening scene again, with “Can” struck through and “Should” written above it.](should-this-be-built.webp "From “can” to “should”.")

Everyone is a product engineer.
