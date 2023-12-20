# FirChart

FirChart is an open source charting library for OHLCV data. It is in early development and the API is likely to change.

The chart contains some basic technical analysis and drawing features. The long term vision is that FirChart can be a fully open source replacement for advanced charting platforms such as TradingView.

I am also planning to add a custom scripting language for new indicators and strategies in the future.

The roadmap for FirChart is primarily driven by the needs of the Trading Cage backtesting platform (see https://tradingcage.com), but I am happy to approve Pull Requests for additional opt-in features that are useful for other applications.

To use, download this repo and open `example.html` in a web browser. There is not currently any documentation, so you will have to read through the code to learn how to use it.

## Development

This chart is based on d3fc. Note that I use a fork of d3fc with a few small changes at https://github.com/tradingcage/d3fc.

The entire library is contained in firchart.js, which contains 2k lines of vanilla JavaScript. It's a bit unwieldy and I plan to refactor it at some point so that it's easier to understand and modify.

I use GitHub Issues and Projects to track the work done on FirChart. If you are interested in contributing, start there.
