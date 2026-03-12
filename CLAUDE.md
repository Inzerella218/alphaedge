$path = ".\CLAUDE.md"

$content = @'
# CLAUDE.md

## Project Name
AlphaEdge

## Project Purpose
AlphaEdge is a custom trading platform focused on:
- live futures charting
- strategy selection
- momentum stock scanning
- broker connectivity
- algo-assisted trade execution
- fast manual overrides and risk controls

The goal is to make this feel like a high-end trading cockpit:
- clean
- minimal
- fast
- chart-first
- execution-focused
- useful in real live market conditions

---

## Core Product Direction

AlphaEdge is not meant to be a generic dashboard.

It should behave like:
1. **Morning briefing terminal**
2. **Live trading cockpit**
3. **Stock momentum scanner**
4. **Execution and risk-control layer**

The platform should help the trader:
- understand what matters today
- identify market bias
- monitor futures structure
- scan for momentum names
- choose the best-fit algo
- execute or exit quickly

---

## Current Main Pages

### Dashboard
Purpose:
- morning recap before trading
- event-risk awareness
- earnings watch
- macro / forex calendar awareness
- political / headline risk awareness
- daily focus guidance

Design goals:
- no clutter
- highly readable
- one-screen summary
- should feel like a professional morning briefing

### Market Strategy
Purpose:
- main live futures trading cockpit
- real chart first
- live scan / bias engine
- algo suggestions
- execution awareness

Design goals:
- chart dominates the page
- should feel like a real trading platform
- bias and “why” should be easy to read
- quick interaction with ES / MES / NQ / MNQ
- should support real trading decisions

### Stock Scanner
Purpose:
- scan momentum stocks
- identify strong premarket / gap / RVOL setups
- show chart and trade panel
- support pinning names
- help identify A setups / B setups / watch names

Design goals:
- fast loading
- reliable fallback behavior
- clean selection and chart view
- useful for real morning stock momentum trading

### Trading
Purpose:
- broker controls
- manual order control
- account visibility
- position management
- algo management
- kill switch / flatten control

Design goals:
- scrollable and stable
- easy manual control
- obvious emergency exit buttons
- clean risk management controls

---

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- Python
- ib_insync
- Interactive Brokers integration

### Charting
- lightweight-charts (TradingView Lightweight Charts)

### Broker / Market Data
- Interactive Brokers / IBKR
- TWS or IB Gateway local connection

---

## Key Files

### Frontend
- `app/dashboard/page.tsx`
- `app/market-strategy/page.tsx`
- `app/stock-scanner/page.tsx`
- `app/trading/page.tsx`
- `components/app-shell.tsx`
- `components/top-nav.tsx`
- `components/futures-chart.tsx`
- `lib/marketData.ts`

### Backend
- `server/api.py`
- `server/algo_api.py`
- `server/ibkr_market.py`
- `server/ibkr_scanner.py`

### Algo Logic
- `algos/strategies.py`

---

## Current Strategy / Algo Concepts

The platform currently revolves around these strategy concepts:
- Opening Range Breakout
- Session Sweep Reclaim
- VWAP Reclaim
- Opening Pullback
- Break and Hold

These algos are currently used in test / scan flows and should later evolve into:
- real chart-aware scan logic
- live probability / context engine
- execution templates
- bracket-order automation

---

## Design Principles

### 1. Chart First
The chart should always be the most important visual element on trading-focused pages.

### 2. Minimal Noise
Avoid excessive cards, labels, or duplicated information.

### 3. Clear Bias
Bias should be easy to understand:
- bullish
- bearish
- neutral

Bias should eventually be driven by:
- price structure
- VWAP position
- opening range
- pressure
- volume expansion
- session location

### 4. Fast Execution
Critical controls should always be obvious:
- Buy Market
- Sell Market
- Close Position Now
- Flatten All
- Kill Switch

### 5. Professional Feel
The UI should feel like:
- a custom pro trading workstation
- not a template app
- not a school project
- not a bloated dashboard

---

## UX Rules

- Prefer one-screen layouts where possible
- Use internal scrolling inside panels instead of breaking the whole page
- Reduce wasted vertical space
- Keep headers thin
- Focus pages should feel tool-like, not presentation-like
- Avoid adding features that make the interface feel academic or cluttered

---

## Scanner Behavior

The stock scanner should:
- prioritize momentum names
- rank by score, premarket %, gap, RVOL
- preserve pinned names
- remain usable even if live scanner data is slow

If IBKR scanner data fails or returns nothing, fallback/demo rows are acceptable for demo and development purposes, but real live rows are preferred in production mode.

---

## Futures Cockpit Behavior

The futures chart area should evolve toward:
- live candles
- symbol switching
- timeframe switching
- VWAP overlay
- opening range levels
- entry / stop / target lines
- auto-scan
- “why this setup” logic
- best-fit algo recommendation
- real execution support

Future desired behavior:
- constant bias updates
- pressure read
- volume expansion / fading read
- algo recommendation that changes with structure
- animation overlays that explain what is happening visually

---

## Risk Management Priorities

High priority controls:
- kill switch
- close position now
- flatten all
- risk per trade
- max daily loss
- pause new entries
- confirm before send
- auto bracket toggle

The platform should always favor safety and clarity over automation hype.

---

## Development Priorities Going Forward

### Highest Priority
1. stabilize scanner reliability
2. improve live futures chart realism
3. improve market strategy bias engine
4. connect futures execution to real broker actions
5. make dashboard use better live event data

### Medium Priority
1. stronger chart overlays
2. live economic calendar feed
3. better “why this setup” logic
4. real-time pressure meter
5. bracket order workflows

### Lower Priority
1. cosmetic polish
2. advanced layout experiments
3. extra modules that do not improve live trading quality

---

## Coding Preferences

When editing this project:
- prefer surgical changes over giant rewrites unless necessary
- keep styles clean and stable
- avoid breaking working pages
- avoid introducing layout bugs by overengineering wrappers
- when possible, make pages fit cleanly within the viewport
- keep the app feeling fast and practical

---

## Notes for Future AI Assistance

When helping on AlphaEdge:
- think like a trading platform designer, not a generic SaaS designer
- prioritize functionality that helps real trading decisions
- favor chart usability over decorative UI
- keep the scanner reliable
- keep the dashboard useful
- keep risk controls prominent
- do not add fluff

The user prefers:
- direct, practical implementation
- terminal-ready commands when editing files
- real progress over theory
- clean and aggressive product direction

---

## Current Vision Summary

AlphaEdge should become:
- a live market reader
- a futures trading cockpit
- a momentum scanner
- a smart execution interface

The ideal end state is a platform that feels like:
- a pro trading terminal
- simplified and customized for fast discretionary + algo-assisted trading
- visually powerful
- risk-aware
- second to none useful in the first hours of the market
'@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "CLAUDE.md"), $content, $utf8NoBom)

Write-Host "Created CLAUDE.md" -ForegroundColor Green