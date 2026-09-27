---
title: How Treasury Yield Reaches Your Wallet: USDY, Taken Apart
summary: USDY's price is almost a straight line, and after the September 16 rate hike it should get steeper. A five-minute animation on where the money sits, how the rate is set, who can buy, and what can go wrong.
tags: [defi, rwa, stablecoins]
---

This is USDY's reference price over the past three years: from $1.00 in 2023 to about $1.147 now. It is almost a straight line. Why? And after the September 16 rate hike, why should it get steeper?

![A hand-drawn chart of USDY's reference price rising in a nearly straight line from $1.00 in 2023 to about $1.147 in September 2026, where a dashed “Sept 16 hike” line bends upward, marked “Steeper!” A stick figure asks “What do I get?”](a-straight-line.webp "Almost a straight line. The hike should make it steeper.")

I made a five-minute hand-drawn animation to answer that, voiced in English. The whole video is below; the rest of this post walks through the same argument with frames from it.

<figure>
<video controls preload="none" playsinline poster="/blog/usdy-explained/video-poster.webp" src="/blog/usdy-explained/usdy-explained.mp4"></video>
<figcaption>The full animation, about 4:45, with voice-over.</figcaption>
</figure>

**Start with the floor the Fed sets.** Long-term bonds drift with market expectations, and they have little to do with USDY. What matters is short-term T-bills. After the hike, banks earn 3.90% on reserves at the Fed, and money funds earn 3.75% in the overnight reverse repo facility, just for parking cash there. A T-bill that yields clearly less than that would not sell, so T-bill yields stay pinned near the floor.

The mental model: the Fed sets the floor, T-bills hug the floor, USDY hugs T-bills. Raise the floor and everything on top of it rises.

![The Fed stands next to a block labelled “The Fed’s floor: reserve rate 3.90%, overnight RRP 3.75%”. A T-bill sits on the block and a USDY coin sits on the T-bill, with the labels “The Fed sets the floor”, “T-bills hug the floor”, “USDY hugs T-bills” and “Raise the floor, everything rises!”](the-feds-floor.webp "The Fed sets the floor. T-bills hug it. USDY hugs T-bills.")

**USDT and USDC hold plenty of Treasuries too, but you get none of the interest.** It goes to the issuer. USDY takes the underlying yield, subtracts fees, and passes the rest to holders as a rising redemption price.

![A stack of T-bills backs a USDY coin with a $1.05 redemption price tag and an upward arrow. An arrow labelled “Yield” goes from the T-bills to “You”; a smaller arrow labelled “Fees” goes to the issuer.](where-the-interest-goes.webp "The yield, minus fees, shows up in the price.")

It comes in two versions. With **USDY**, the price rises and the number of tokens you hold stays the same. With **rUSDY**, the price is pegged at $1 and your balance grows instead. Either way, a useful mental model is that USDY is roughly a share in a dollar money fund, wrapped in a token: it earns like a fund share and moves like a token.

![A USDY coin with a money-fund share inside it, between the phrases “Earns like a fund share” and “Moves like a token”.](fund-share-in-a-token.webp "Roughly a dollar money-fund share, wrapped in a token.")

To take USDY apart, I ask four questions.

**1. Where does my money go?** Into a vault: an issuing entity designed to be bankruptcy-remote from Ondo, the operating company. It holds short-term T-bills, a short-Treasury ETF, or bank deposits. A gatekeeper, Ankura Trust, acts as verification agent and collateral agent: it checks the assets, and it takes over if things go wrong.

![Ondo, the operating company, stands outside a brick wall marked “Bankruptcy-remote”. Behind it, the issuing entity is a vault holding T-bills, a T-bill ETF and bank deposits. On the right, a gatekeeper from Ankura Trust is labelled “Verification agent” and “Collateral agent”.](where-the-money-goes.webp "The vault, the wall around it, and the gatekeeper.")

**2. How is the interest set?** Each month, Ondo sets a rate and writes it into an oracle contract. `RWADynamicOracle` sets a daily rate for each time range and compounds within it, so the price takes one small step every day. Zoom out and the steps become our straight line.

![Question 2, “How is interest set?”. A magnifying circle shows the price line as a staircase, “Zoomed in: one small step a day”; the full chart from June to September looks like a straight line, “From afar: a straight line”.](one-step-a-day.webp "Zoomed in: one small step a day. From afar: a straight line.")

**3. How do I get in and out?** It works like a bank counter. Instant minting and redemption against USDC go through `USDY_InstantManager`. If your address is not registered in `OndoIDRegistry`, the transaction reverts. On top of that there are two layers of limits: one per user and one global.

![Question 3, “How do I get in and out?”. A robot clerk sits at a counter labelled USDY_InstantManager, with a registry book marked OndoIDRegistry on the desk. Two gauges on the right show a per-user limit and a global limit, each with a cap.](mint-and-redeem.webp "A counter, a registry, and two limits.")

**4. What if something goes wrong, and who can freeze me?** A guard, `OndoCompliance`, checks sanctions and jurisdiction at mint and at redemption. Transfers are checked against a blocklist, and the contracts can be paused.

![Question 4, “What if things go wrong?”. A robot guard labelled OndoCompliance stands next to a gate marked “Sanctions / Jurisdiction” over “Mint & redeem”, with a pause button and a red “Blocked” box.](the-guard.webp "The guard at the gate: sanctions, jurisdiction, blocklist, pause.")

Then there is the fine print. If the issuer fails to pay redemptions, Ankura liquidates the assets to repay holders, but only with the holders' approval.

![A document titled “The fine print” is stamped “Payment default”. Next to it, the Ankura gatekeeper and a group of holders, with the note “Needs holders’ OK”.](the-fine-print.webp "On a payment default, the gatekeeper acts, with the holders’ approval.")

**Most of the system runs off-chain.** The backend does three things: it vets accounts and adds their addresses to the on-chain whitelist, it writes each month's new rate into the oracle, and it usually reconciles the on-chain supply against the off-chain assets.

![An off-chain backend robot next to a checklist: 1, vet accounts and whitelist their addresses on-chain; 2, write each month’s new rate into the oracle; 3, reconcile on-chain supply with off-chain assets (usually).](off-chain-backend.webp "Three jobs for the off-chain backend.")

Put together, the whole picture runs from your wallet, through a front end and a KYC back end, to a few key on-chain contracts, and finally to the off-chain vault.

![A flow from “Your wallet” to “Front end” to “KYC back end”, then into an on-chain box holding Whitelist (OndoIDRegistry), Mint / redeem (USDY_InstantManager) and Oracle (RWADynamicOracle), and finally an off-chain box holding the Issuer, the underlying assets (T-bills, ETF, deposits) and the Ankura Trust gatekeeper.](the-whole-picture.webp "Wallet, front end, KYC back end, on-chain contracts, off-chain vault.")

**So what do you get?** The T-bill rate minus fees. After a hike, the slope gets steeper. It is an on-chain version of dollar savings, not a way to get rich quickly.

**Honestly, there is a bar to getting it.** People in the US, Canada and some other places cannot buy it. In Hong Kong, individuals must be professional investors, which means a portfolio of about HK$8 million. The EU, the UK and Singapore also require professional or accredited investor status.

![A stick figure in front of a doorway piled with hurdles, next to three cards: “US, Canada & others: prohibited”, “Hong Kong: professional investors (~HK$8M)” and “EU, UK, Singapore: professional or accredited”.](who-can-buy.webp "Who can buy, and who can’t.")

**Many people actually meet USDY on the secondary market.** It transfers like a stablecoin; only minting and redeeming need an account with the issuer. But people in prohibited regions cannot buy it there either. The market price can also drift from the reference price, and without an account you cannot redeem with the issuer.

![Two wallets pass USDY back and forth under “Secondary market”; a chart shows a wobbly market price drifting around the reference price, labelled “May drift”. A dashed line from the wallets to the issuer’s “Mint & redeem” counter is crossed out: “Can’t redeem directly”, “Account needed”.](secondary-market.webp "Easy to trade, but the price can drift and redemption needs an account.")

Side by side: holding USDT pays nothing. Holding USDY pays the T-bill rate minus fees, but it is hard to get, with regional limits everywhere. Bank dollar deposits and money funds are easy to get, and money funds pay close to T-bills, but neither works on-chain.

![A table with columns Yield, Access and On-chain. Hold USDT: 0, low bar, on-chain. Hold USDY: T-bill rate minus fees, high bar (region-limited everywhere), on-chain. Bank USD deposits or money funds: low; funds ≈ T-bills, low bar, not on-chain.](side-by-side.webp "USDT, USDY and a bank or money fund, side by side.")

**To be clear about what you hold:** economic exposure to T-bills. You do not own the T-bills, and you cannot demand delivery of them. The other risks are the issuer and custody, the contracts and the oracle (which can be paused), compliance freezes, secondary-market liquidity and discounts, and a lower yield when rates fall.

![A stick figure next to a framed T-bill that is crossed out, under “Economic exposure” and a struck-through “Own T-bills”. Five warning cards: issuer & custody; contracts & oracle (can be paused); compliance freezes; secondary liquidity & discounts; lower yield when rates fall.](what-you-actually-hold.webp "Economic exposure, not the T-bills themselves, and five risks.")

Back to the line. The Fed hikes, T-bill yields rise, Ondo lifts the monthly rate, the oracle's slope steepens, and the price in your wallet climbs faster.

USDY is roughly a dollar money-fund share, wrapped in a token.
