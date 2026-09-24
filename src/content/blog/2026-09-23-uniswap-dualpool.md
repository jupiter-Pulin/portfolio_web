---
title: "The Money in Your LP Position Can Earn Interest Too: Understanding Uniswap DualPool"
summary: DualPool keeps an AMM's inventory in a yield vault and brings it out only when a trade needs it. The two incomes can stack — but the two sides' yields are weighted, costs still come off, and the vault's withdrawal limits become the pool's.
tags: [defi, amm, liquidity]
---

Say you have $10,000 in stablecoins.

Put it in a lending market, and it earns interest. Use it to provide liquidity, and it earns trading fees. But in a traditional AMM position with plain stablecoins, the money sitting in the pool doesn't automatically earn a lending yield on top.

At this point, many people's first reaction is: is there a way for the same money to earn both?

Uniswap DualPool is trying to solve exactly that. It keeps market-making capital in a yield vault most of the time and brings it out to provide liquidity when a trade needs it. On July 22, 2026, Uniswap Labs announced that this v4 hook, designed together with Spark, was live. [Official announcement](https://blog.uniswap.org/dualpool-hook-is-now-live)

**What makes it worth discussing is that the same market-making inventory gets one more source of income.** How much more you actually end up earning depends on where the money comes from, where it goes, and what it costs — taken together.

![A coin cycles between a green Vault, where it earns interest, and a pink AMM kiosk, where it earns trading fees: pulled out to fill a trade, then the balance goes back.](dualpool-cycle.webp "Original chibi illustration. The characters appear in different places to show the same money at different stages.")

To understand DualPool, start by thinking of an AMM as an automated currency-exchange counter.

Someone brings USDC to swap for USDT: the counter takes the USDC, hands out USDT, and charges a fee. LPs supply the counter's inventory, and they also bear the result when the inventory's mix and value change.

The counter needs money to do business. But between two trades, those plain stablecoins don't earn any lending interest just by sitting there.

DualPool's arrangement: the inventory goes into a Vault first — a smart-contract vault that runs a yield strategy. When a trade arrives, a hook — contract logic that can run before and after a swap — pulls out the funds the trade needs.

The whole process fits in one line:

**Vault earns yield → withdraw the funds needed → deploy market-making liquidity and fill the trade → remove the liquidity → deposit the balance back into the vault.**

The withdrawal, the trade, and the re-deposit all happen inside the same successful on-chain transaction. The core loop doesn't wait for a bot to move money every few minutes. After the trade, the amounts of the two tokens may have changed; what goes back into the vault is the post-trade balance. [Mechanism and implementation](https://github.com/Uniswap/v4-hooks-public/blob/main/src/alf/DualPoolHook.sol)

That also explains the appeal: the money keeps earning while it waits for trades, and it keeps the ability to make markets.

![The pink, white and cream abstract key visual of Uniswap Labs' DualPool announcement.](uniswap-official.webp "Image from Uniswap Labs' official DualPool announcement, unmodified.")

So what kind of rate environment is this extra yield sitting in today?

Start with a set of numbers shown on official Ethereum front-ends around 11:20–11:23 a.m. (UTC+8) on September 23, 2026: Aave V3 Core showed a 3.89% supply APY for USDC and 3.74% for USDT; Spark Savings showed 3.60% APY for USDC and 3.50% for USDT. [Aave markets](https://app.aave.com/markets/) · [Spark Savings](https://app.spark.finance/)

![DeFi rate snapshot, September 23, 2026, Ethereum, supply or savings APY: Aave V3 Core USDC 3.89%, USDT 3.74%; Spark Savings V2 USDC 3.60%, USDT 3.50%.](rates-snapshot.webp)

These are rates from a few products at one point in time. They don't represent the whole DeFi market, and they aren't the measured yield of any DualPool. APY is a compounded measure, the numbers move, and the risks differ from product to product.

Still, they give an intuitive reference: in this sample, stablecoin deposit or savings yields sit roughly between 3.5% and 3.9%. If money that used to earn only market-making fees could also collect part of a vault's yield, that could genuinely change an LP's income structure.

**Before looking at the rate, ask who is paying.**

In a lending market like Aave, the income comes mainly from borrowers paying interest. Borrowing demand, utilization, and the rate curve together shape what suppliers earn. The borrow side and the supply side are two different rates: at the same observation time, Aave's variable borrow APY for USDC was 4.62%, while the supply APY was 3.89%. You can't treat the number borrowers pay as the number depositors actually receive. [How Aave lending works](https://aave.com/help/aave-101/introduction-to-aave)

For vaults, you have to look one level further, at the underlying strategy. Spark's docs label the yield source for spUSDC and spUSDT as the Spark Liquidity Layer, while sUSDS corresponds to the Sky Savings Rate set by Sky governance. Even when the numbers on screen look similar, the capital allocation and rate mechanics behind them can differ. [Spark docs](https://docs.spark.finance/products/spark-savings)

Rate markets also have a term dimension. Pendle PT, for example, separates the claim on principal from future yield: the purchase price and the redemption mechanism at maturity determine the return if you hold to maturity, while selling early means facing the market price at that time. The underlying asset's risk doesn't disappear just because it says "fixed yield". [Pendle docs](https://docs.pendle.finance/pendle-v2/AppGuide/UsingPendle)

AMM fees are yet another kind of income: the money comes from traders, and how much depends on volume, the fee tier, and your effective liquidity. One day of high fees doesn't prove they will hold for the next year.

So DualPool's return has to be counted piece by piece: how much the chosen vault actually earned, how much market making actually collected, minus the costs this position bears.

There's also a number here that's especially easy to misread.

If a pool's USDC side yields 3.6% and its USDT side yields 3.5%, the vault yield on the whole principal is not 7.1%. Assuming the two sides are equal in size and everything else is the same, this part is roughly the weighted average — 3.55%. Actual trades shift the inventory on both sides, and the accounting has to follow.

**Two income sources can stack; the yields of the two sides have to be weighted.**

Now let's run a complete set of numbers on $10,000. Everything below is a teaching assumption, not a quote from any real pool.

Assume a one-year holding period: the vault actually generates $350, the LP fees allocated to this money come to $200, and the operating and service costs the position actually bears total $80. Setting aside asset prices and position gains or losses for now, the net gain is:

**$350 + $200 − $80 = $470, or 4.7% of the starting principal.**

If depositing in the vault alone would earn that $350, then in this example, adding market making leaves you an extra $120. Whether that $120 is worth taking on additional price, execution, and contract risk is the real judgment call.

If a further $600 in asset or market-making losses — not counted above — occurs, the overall result becomes a $130 loss. You can collect both incomes and still lose money in the end.

**DualPool also wires the vault's withdrawal capacity into the conditions market making runs on.**

This is easier to overlook than "an extra yield". How much the vault manages on paper and how much of the underlying token can be withdrawn right now are two different questions. ERC-4626, the vault interface standard, defines asset conversion and withdrawal limits separately. [ERC-4626](https://eips.ethereum.org/EIPS/eip-4626)

If the underlying vault is temporarily short of available funds, the liquidity that can be brought out to support trades shrinks too. Products that require queued redemptions, charge entry or exit fees, or carry special permission restrictions can't be treated as suitable for this loop just because they support the same interface. [Vault compatibility implementation](https://github.com/Uniswap/v4-hooks-public/blob/main/src/alf/base/PoolVault.sol)

Nor can you simply bolt a high-yield RWA vault, any lending product, and an AMM together. Their withdrawal mechanics, costs, and permissions have to be compatible with each other.

For ordinary users, DualPool is even less a product where you click in and collect a uniform APY. An operator has to choose the trading pair, the underlying Vault, and the liquidity distribution, and decide whether to open it to outside deposits. Existing plain LP positions won't automatically upgrade to "dual yield". [DualPool configuration](https://github.com/Uniswap/v4-hooks-public/blob/main/src/alf/DualPoolHook.sol)

When I look at a specific pool, I start with the yield breakdown and the exit conditions: how much comes from fees, how much from the vault, whether it relies on rewards; what the underlying asset is; how much can be redeemed right now; and what permissions the operator holds.

Only once that information is complete does a headline APY become comparable.

I think the direction most worth watching in DualPool is **making market-making inventory yield-bearing too**. For operators who provide stablecoin liquidity over the long term, even if the extra income isn't spectacular, as long as the scale is large enough and costs stay under control, it could influence how much capital they are willing to keep in the market.

In the future, when we evaluate an AMM pool, besides asking "is the volume big enough, are the fees high enough", we can add one more question: **what is the money waiting for trades doing right now?**

That is exactly why DualPool is worth continuing to study.
