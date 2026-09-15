---
title: After LLMs Got Stronger, We Deleted Some Nodes from Our Agent Workflow
summary: Loop began as a fixed graph of nodes. As models got better the graph became the bottleneck, so we kept the boundaries the kernel enforces and let role agents choose the path.
tags: [agents, workflow]
---

![Don't constrain the path, constrain the outcome. Before: a robot on fixed rails past Analyze, Spec, Implement, Test, Review, Fix and Merge. Now: Router, Spec Agent, Maker and Reviewer inside guardrails, on the way to a delivery gate of tests passed, review valid, safety checks and merge approved.](constrain-the-outcome.webp)

When we first built Loop, we split the process into many nodes: analysis, decomposition, implementation, Review, and we tried to design the failure branches upfront. That was fine at the time. The models were limited, so the engineering process had to prescribe a path for them. Otherwise, things could easily spin out of control.

Later, as models got much better at reasoning, tool use, and context understanding, we started to feel that too many nodes were holding them back. Pre-orchestration has one problem: you have to guess upfront how the task will unfold. But software development rarely follows your guesses. An Agent might find a gap in the Spec while implementing, or after Review decide it should add tests first rather than change the code right away. If every next step is baked into the flowchart, it has to follow the original path even when it sees a better one.

So Loop gradually became a collaboration among several role-based Agents: Router decides the next step based on the current situation, Spec Agent makes the plan and acceptance criteria clear, Maker implements, and Reviewer checks independently.

But this isn't about letting Agents run wild. The constraints shifted from “which nodes must it pass through” to “what results must it deliver.” Tests must pass. Review must correspond to the current code version. If the main branch changes, verification must be rerun. Safety boundaries like no pushing still can't be bypassed. These are enforced by the code kernel, not by relying on the Agent to follow them on its own.

We also replaced some process orchestration with Skill and few-shot. Skill spells out what a role should do, the delivery format, the checks, and what it must not do. Few-shot shows it what good judgment looks like, and what looks reasonable but is actually taking a shortcut. A flowchart can only tell you roughly how things should go; few-shot is more like teaching it how to judge a situation. The stronger the model, the more useful these examples are.

What people do has changed too. We used to approve the execution process frequently. Now we mainly look at two points: first, confirming the Spec, to make clear what we're actually doing; second, confirming the Merge, to decide whether the result should go into the main branch. How it gets there in between is left to the Agents as much as possible.

Fixed processes are still useful, of course. Compliance, high-risk external operations, and irreversible actions still need clear steps. But for other constraints, it's worth asking again: is this protecting the system, or is it just compensating for what the previous generation of models couldn't do?

In the future, Agent engineering may be more about this: which boundaries must stay, and which nodes can be removed. Having more nodes isn't necessarily an advantage.
