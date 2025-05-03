# Strategies overview:

## S0
early attempt; based on the ability to exit `Hyperliquid` at "Oracle" price.
This is possible at some exchanges like `Bitmex`. `Hyperliquid` doesn't have a force exit.
When a position is taken, there are only 2 ways to exit:
1) position is liquidated // at "Oracle" price
2) position is sold to someone else
Technically `Hyperliquid` should be a "contract" style position, so we should be able to exit that contract manually (force exit) at the Oracle price, but it's not possible.

> [!CAUTION]
> S0 failed


## S1
`BinanceSpot` is source data(public orderbook) only and doing trades on `Hyperliquid` only.
`BinanceSpot` price changes are ahead of `Hyperliquid`; also `Hyperliquid` uses EMA for Oracle price that lags 1-3 seconds behind `Binance`.

**Why `BinanceSpot`?** - likely has more liquidity and volatility.

Leveraging `BinanceSpot`(price leader) to predict price movement and take a position before `Hyperliquid` adjusts.
Enter a position part is mostly ok (60-80% accuracy on predicting the direction).
We can limit enter to when we predict the price to go up.
Just because the price on `Binance` does X, it doesn't force `Hyperliquid` to follow, 
so some padding for slippage should be allowed.
It make sense to aim at 10-15bps (basis points) to overcome the `Hyperliquid` fees
`Binance` buy price is used as a signal to determine the forecast trend compared to `Hyperliquid`.
**Examples:**
- When _best buy price_ on `Binance` is 20-30bps higher than the `Hyperliquid` _best buy price_ = opportunity
- `Binance` "price" // best buy price - Hyper "price" // best buy price = 10bps // this event would be too low
- `Binance` "price" // best buy price - Hyper "price" // best buy price = 30bps // this difference would likely be high enough, submit orders and try to capture it
**s1 is limited by market conditions**
let's say _the best price_ we thought we can get was `$10`, but the _best price_ we can actually get is `$10.05`
On the buy side we can work-around this with limit orders.
On the sell side limit orders are more messy because it would mean we're potentially trapped in this position.
These opportunity are fast.. so we likely buy and sell within 1-2-3-4 seconds timeframe

**Event trigger**
```sh
Binance "price" // best buy price
vs
Hyperliquid "price" // best buy price
Hyperliquid "sell price" // best sell price
```
> [!IMPORTANT]  
> Known issues

**1) double-check the formula**
1.1) to confirm if the right price to calculate the opportunity is used
1.2) if the best sell price is taking into account
just because we can buy at a good price.. it doesn't mean we can sell at a good price
because if sell price is too high.. we've lost

**2) slippage and not accurate orderbook data**
  - slippage is _"our fault"_ because of the latency of the system;
if we're extremely fast.. slippage could be 0 or very minor
if we're slow.. slippage is highly likely and probably an impact

 - not accurate orderbook is _"not our fault"_; maybe the order we thought we could get is already gone

## S2
Fully automated spread trading `Binance` and `Hyperliquid`. [Design document](https://docs.google.com/document/d/15FW415ejEXvGIfPO9uOPgGVkHxJ15nMqBU7zKW6soWI/edit?pli=1)
requires `Binance` api and orderbook submission.

## S3
Manual spread trading. The same events as **s2**, but the order placement are executed manually. This is a step towards making an OTC terminal(correct term is "Manual order execution terminal"), but more for debugging and developer use;

## S4
Inherited from **S2** - use `Bitget` instead of `Binance`

## S5
debug version of **S4**
