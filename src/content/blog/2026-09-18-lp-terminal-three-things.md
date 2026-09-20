---
title: An LP terminal should keep three things together
summary: Why a position was opened, what has changed, and what acting now would cost — the three things I want an LP terminal to hold in one place. Concept-stage principles for LP-terminal.
tags: [defi, liquidity, product]
---

An LP terminal should keep three things together: why a position was opened, what has changed, and what acting now would cost.

![Concept slide: an LP terminal should be built around the position — which pool, what range, what changed, and what would exit cost.](position-first.webp)

Choosing a pool and setting a range establish the initial position. Later, the LP needs to judge whether those choices still fit their intention. The product question is how to make that comparison clear throughout the life of the position.

That is the starting point for LP-terminal. I’m designing it around three hypotheses. *The project is at the concept stage; these are the principles I want to test.*

## The position is the core object

For an LP managing open positions, the first screen should answer: **which position needs a decision, and why?**

Put the pool, selected range, current asset mix, and in-range or out-of-range status together. Keep the entry rationale and planned review conditions alongside them. Show what changed since the last check. Put fees alongside estimated **impermanent loss** relative to holding the deposited assets, using the same period and currency, and show dollar P&L separately. Make the comparison basis visible.

That gives the user enough context to investigate a position before deciding whether to act.

![Position card mockup for an ETH / USDC position: selected range, asset mix and what changed since the last check on one row, with fees, estimated IL and dollar P&L measured over the same period against a hold-deposited-assets benchmark.](position-card.webp)

## Information serves the next decision

The checklist I want the terminal to support is concrete:

- **Which pool?** Separate fee income from incentives. Show recent volume, active liquidity, the fee tier or dynamic fee rules, and relevant **hooks**. The user should understand the source of the projected return and the conditions attached to it.
- **What range?** Connect the price view and range width to a management plan: how often the LP will check, and what would trigger a reassessment.
- **What changed?** Show shifts in asset mix, range status, accrued fees, and costs since the last review. Help the LP assess whether the position still fits the original intention.
- **What would exit cost?** Show the expected assets received, gas, and any swap costs needed to reach the intended exit asset.

This gives the framework a clear division of responsibility. **Pools** should support entry decisions. **Positions** should support ongoing review, adjustments, and exits. **Swap** and **Bridge** belong in asset preparation, with their costs and status connected to the position task. The home screen should give priority to the positions that need attention.

![Setup versus Manage: setup covers price, range, review frequency and adjustment plan; manage covers what changed since the last check, asset mix, range status, fees against estimated IL, and costs. Swap / Bridge sits underneath as asset preparation.](setup-vs-manage.webp)

## Every write gets a consistent review and follow-through

The principle is **Review → Simulate → Sign → Status / position update**.

Before signing, explain expected asset changes, authorization scope, and estimated costs. If a simulation fails, stop the affected transaction from proceeding to signing and show what needs checking. Present **simulation results** as estimates. After submission, connect the transaction status back to the position and make any unfinished steps visible.

This principle applies to approvals as well as position changes. Each step should have a clear expected outcome and a traceable result.

![The shared transaction path: Review, Simulate, Sign, Status / position update — with a failed simulation stopping the transaction before signing and sending it back to review.](transaction-path.webp)

![The overall framework: Pools for entry decisions, Positions for ongoing review, Swap and Bridge for asset preparation, all of them ending in the same Review → Simulate → Sign → Status path.](overall-framework.webp)

The first version should test this with one complete scenario: revisit an existing position, compare it with the original plan, and review the cost and outcome of a proposed adjustment.

I’ll share a narrower prototype when one slice of this workflow is testable.

![Concept illustration of the LP Terminal screen: open positions on the left, the selected position with its range and what changed in the middle, and the next action — hold, adjust or exit — with its adjustment preview on the right.](lp-terminal-concept.webp)

**When you’re managing an open LP position, what’s the hardest call to make? I’d love to hear where the real pain points are.**
