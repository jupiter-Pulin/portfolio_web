---
title: Cash for Crypto in Hong Kong, Then a DEX: Does CARF Report It to the Mainland?
summary: A mainland tax resident buys ETH with cash at a Hong Kong OTC shop and swaps it on a DEX. Whether CARF sends that back depends on a few specific conditions, not on cash or the word "DEX". A fictional case, worked through step by step.
tags: [crypto, tax, compliance]
---

Suppose you are a tax resident of mainland China. You go to an OTC shop in Hong Kong, buy ETH with cash, and have the shop send it straight to your own wallet. Then you swap the ETH for USDC or USDT on a DEX. You never use a Hong Kong bank account, and you never convert the crypto back into RMB.

Could these trades be automatically reported to the mainland tax authority because of CARF?

![A hand-drawn flow: an HK OTC shop (cash to ETH, the shop sends the coins) sends ETH to a self-custody private wallet, which swaps on a DEX (ETH to USDC / USDT). “HK bank account” and “Back to RMB” are crossed out. A dashed red line labelled “CARF auto-report?” runs from the wallet to “Mainland tax authority: automatically notified?”, while a stick figure looks on, thinking.](the-question.webp "The case: cash in Hong Kong, a private wallet, a DEX. Does the mainland hear about it?")

I made a hand-drawn explainer video about this. This post walks through the same argument with frames from it. The person and the trades are fictional, and none of this is tax advice.

**You can't answer it by asking whether you cashed out, or whether you used an exchange or a DEX.** What has to line up is a set of specific conditions: which year the trade took place, who provided the service, where you are tax resident, and whether the jurisdictions involved have an applicable exchange arrangement.

I recently watched an interview with the founder of FinTax about crypto tax, and I think this question deserves its own explanation. Even if "regulation is expanding its reach", for a specific user you still have to go through these checks to know the real impact.

![Two crossed-out questions, “Did you cash out?” and “Exchange or DEX?”, each marked “not enough on its own”. Below them, four cards: Tax year (which year, rules in force that year), Provider (who served you, who has to report), Residency (an ID card is not residency) and Exchange (reportable and partner jurisdictions). A banner reads “Let’s walk through the example: Residency → Timing → Shop & user → Lists → DEX → CRS”.](four-conditions.webp "Don't jump to conclusions: four conditions decide it.")

## Residency: an ID card isn't enough

Suppose Lin already has a Hong Kong identity card, but mainly works and lives in Shenzhen. Does that card prove he is no longer a mainland tax resident? On its own, no.

Mainland tax residency is determined by a domicile test, plus a days-of-residence test for individuals without a domicile. "Domicile" has a specific legal meaning here: it is judged on facts such as household registration, family and economic interests, not just on whether you own an apartment. And "183 days" is not the only test for everyone.

So even after updating your ID document on an exchange, you still need to confirm your actual tax residency. A dropdown option on a platform can't do that step for you.

![Lin, a fictional stick figure holding an ID card, next to cards for “HK identity card: already has one” and “Shenzhen: mainly works and lives here”. On the right: “This card = no longer a mainland tax resident? On its own, no.” Two tests, the domicile test (hukou, family, economic ties, judged on the facts) and the days-of-residence test; “Owning an apartment” and “183 days = the only test” are crossed out.](residency.webp "An HK identity card doesn't settle mainland tax residency.")

To keep the rest clear, three assumptions: Lin is a tax resident of mainland China only; the shop's reporting obligations follow Hong Kong's local rules; and after buying, he self-custodies the ETH and trades on a DEX on his own.

## Timing: Hong Kong hasn't started

As of this check, the plan published by Hong Kong's IRD, still subject to the relevant bill being passed, is to implement CARF from January 1, 2027, with the first exchange of information in 2028.

So if Lin is talking about a trade at a Hong Kong shop in 2026, we can't borrow rules already in force elsewhere and say this shop must report under Hong Kong CARF right now. The shop may already have other identity checks or record-keeping requirements, but those should be read under their own regimes.

![A timeline: 2026, “Bill pending, checked Oct 10”; 2027-01-01, “Planned start, HK CARF”; 2028, “First exchange, planned”. Lin buys at an HK shop in 2026: “Can’t borrow rules in force elsewhere to say it must report under HK CARF now”. A second box: “Other rules the shop may have: ID checks, record keeping. Read each under its own regime.”](timing.webp "HK IRD's published plan, still subject to the bill being passed.")

## Shop and user: two separate questions

Once Hong Kong implements it, there are two separate questions.

One is whether the shop is a reporting service provider. An OTC dealer that regularly exchanges crypto-assets and buys and sells them with customers can meet that definition. Paying in cash doesn't stop a cash-for-ETH trade from being a fiat exchange.

The other is whether Lin is a reportable user. CARF's reporting rules look at the user's tax residence and the scope of reportable jurisdictions. The shop being a reporting service provider doesn't mean every customer gets the same reporting outcome.

![Q1: “Is the shop a reporting provider?” An OTC dealer that regularly exchanges crypto-assets can meet the definition, and cash to ETH is still a fiat exchange. Q2: “Is Lin a reportable user?” The rules look at the user’s tax residence and which jurisdictions are reportable; whether Lin counts depends on that year’s lists. Bottom: “Shop is a reporting provider ≠ every customer gets the same outcome.”](two-questions.webp "The shop's status alone doesn't decide each customer's outcome.")

## The lists: is the mainland on them?

As of this check, the OECD commitments list I found, last updated on September 14, 2026, includes Hong Kong but not mainland China. Hong Kong's IRD says its CARF lists of reportable jurisdictions and partner jurisdictions will be published separately.

So the available information doesn't support the claim that a user who is only a mainland tax resident will definitely have their data sent back to the mainland under CARF after buying crypto in Hong Kong. To know whether Lin will be reported in future, you have to look at the rules and lists that actually apply in the relevant year.

If, in that year, the mainland isn't a reportable jurisdiction for Hong Kong CARF and no other extension applies, you can't treat Lin as a reportable user just because the shop is subject to CARF. Likewise, a shop asking you to fill in tax information doesn't, on its own, prove that the information will be exchanged back to the mainland: Hong Kong's proposal would allow the same due diligence procedures to be applied to non-reportable users.

![Two source boxes: the OECD CARF commitments list (last updated Sep 14, 2026: Hong Kong listed, mainland China not listed) and the HK Inland Revenue Department (reportable and partner jurisdictions to be published). A dashed arrow from Hong Kong to Mainland China: “Definitely exchanged back? The evidence doesn’t show that.” Below: if the mainland isn’t reportable that year, the shop being under CARF doesn’t make Lin reportable; a shop asking for tax info ≠ it will be exchanged; HK’s proposal may apply the same due diligence to non-reportable users.](the-lists.webp "What the lists say as of the check, and what they don't.")

Collecting information, reporting locally and exchanging across borders are three steps, and each needs to be assessed separately.

![Three hatched boxes joined by dashed arrows labelled “Assess separately”: ① Collect (due diligence, tax forms), ② Report locally (to the HK IRD), ③ Exchange abroad (to partner jurisdictions). Caption: “Step one doesn’t guarantee step three.”](three-steps.webp "Step one doesn't guarantee step three.")

## The DEX part: who reports?

Now Lin has his ETH and swaps it for stablecoins on a DEX. This part needs a fresh assessment.

Crypto-to-crypto swaps are a transaction type CARF can cover. But the fact that an on-chain swap happened doesn't tell you who is responsible for reporting it. You have to look at whether, behind the service, there is an individual or entity that runs the exchange business and has enough control or influence over the platform to meet the obligations. Being "non-custodial" doesn't automatically take a service out of scope.

At the same time, the OECD lets implementing jurisdictions defer applying the control test to DeFi arrangements while further guidance is developed. That's an option for implementers, not a global DEX exemption. To assess a particular DEX, you need to look at its business structure and the jurisdictions that apply.

![“An on-chain swap: ETH → USDC / USDT” and “Crypto-to-crypto: a transaction type CARF can cover”, with “Non-custodial = out of scope” crossed out. On the right: “Who must report this trade? A swap happening doesn’t answer that” and “Is there a person or entity behind the service that runs the exchange business, has enough control or influence, and can meet the obligations?” Below: the OECD lets jurisdictions defer the control test for DeFi, an option for implementers, not a global DEX exemption.](the-dex.webp "A swap happening doesn't tell you who has to report it.")

## How far the OTC shop's reporting goes

If the Hong Kong OTC shop only sold Lin the ETH for cash and he made the later swap on his own, you can't assume the shop is responsible for reporting all of his later DEX trades. A service provider's reporting scope has to match the relevant transactions it actually carries out.

But that doesn't change the fact that the ETH purchase itself needs its own assessment of whether it is reportable. Moving the coins into your own wallet doesn't erase the transaction record that already exists. And if a reporting service provider separately carries out a transfer out, a corresponding transfer report may also come into play.

![The flow again: HK OTC shop → private wallet → DEX. A green bracket over the shop reads “Trades the shop actually executed”; a red bracket over the wallet and DEX reads “Done by Lin alone, can’t assume the shop reports these”. Below: “A provider reports the transactions it actually carries out”, “The ETH purchase itself needs its own reportability check; moving coins to your wallet doesn’t erase the existing record”, and “If a provider separately executes a transfer out, a transfer report may also apply.”](the-shop.webp "A provider reports what it actually carries out.")

## CRS: the point that gets skipped

The mainland is indeed a reportable jurisdiction under Hong Kong's existing CRS, but CRS targets qualifying financial accounts. In Lin's example, with a cash purchase, a private wallet and a DEX swap on his own, these facts alone give us no basis to say he now has a reportable account maintained by a Hong Kong financial institution.

We shouldn't invent a path like "the bank has already sent all your on-chain trades back" just to make the story more dramatic. Then again, "no bank account" isn't a magic condition that rules out CRS either. If the case involves a product with an account, custody or other financial services, it needs to be analyzed again.

![Hong Kong (CRS in force, CARF planned) and Mainland China (Lin’s tax residence) joined by two arrows: a dashed one, “CARF: crypto-asset trades (lists pending)”, and a solid one, “CRS: mainland is already a reportable jurisdiction”. In between: “CRS covers qualifying financial accounts kept by HK institutions.” Lin’s case doesn’t show a reportable account; “The bank sent all your trades home” is crossed out; “No bank account doesn’t automatically rule out CRS.”](crs.webp "CRS is about financial accounts, not every trade.")

## My take: spell out the boundaries

What crypto tax content most needs to make clear are exactly these specific boundaries. Buying with cash doesn't make you exempt just because it's cash. Using a DEX doesn't settle whether there's a reporting obligation just because of its name. And Hong Kong joining CARF doesn't mean every transaction by a mainland user will automatically be exchanged back to the mainland.

These conclusions only address information reporting and automatic exchange under CARF. They don't mean the information can't be obtained through other lawful channels; whether there's a tax liability, and whether other laws apply, has to be judged separately.

![Three cards: “Buying with cash: cash alone doesn’t make you exempt”, “Using a DEX: the name alone doesn’t settle the reporting duty”, “Hong Kong joining CARF doesn’t mean every trade of a mainland user is auto-exchanged home”. A yellow note: these points only cover reporting and automatic exchange under CARF. Four tiles: Tax year, Residency, Provider, Exchange. Bottom: “‘Definitely reported’ / ‘Definitely not’: first check, does it spell out these conditions?”](boundaries.webp "Before you believe “definitely reported” or “definitely not”, check the conditions.")

So next time you hear that some way of buying crypto "will definitely be reported" or "will definitely not be reported", check first: does it actually spell out these conditions?

## Sources

Checked on October 10, 2026. Hong Kong CARF is still subject to the relevant bill being passed, so re-check the legislation and timeline before relying on any of this.

- [State Taxation Administration: tax residency rules](https://www.chinatax.gov.cn/download/ssxxjhzt/china.pdf)
- [HK IRD: CARF implementation, lists and due diligence](https://www.ird.gov.hk/eng/tax/dta_carf.htm)
- [OECD: CARF rules, Sections II and IV](https://www.oecd.org/en/publications/international-standards-for-automatic-exchange-of-information-in-tax-matters_896d79d1-en/full-report/component-6.html)
- [OECD: CARF commitments list](https://www.oecd.org/content/dam/oecd/en/networks/global-forum-tax-transparency/commitments-carf.pdf) (last updated September 14, 2026 when checked)
- [OECD: CARF FAQs, Section IV, question 1](https://www.oecd.org/content/dam/oecd/en/topics/policy-issues/tax-transparency-and-international-co-operation/faqs-crypto-asset-reporting-framework.pdf)
- [OECD: commentary on transfer reporting](https://www.oecd.org/en/publications/international-standards-for-automatic-exchange-of-information-in-tax-matters_896d79d1-en/full-report/component-7.html)
- [HK IRD: AEOI FAQ, question 37](https://www.ird.gov.hk/eng/aeoi/reg/faq.htm)
