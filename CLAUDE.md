# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Royal Gambit is a chess variant that combines traditional chess with playing card effects. This is a collaborative project between Karl (developer) and his mother (game designer) to create a digital version of their physical game.

**Core Game Mechanics:**
- Traditional chess rules as the foundation
- Each player has a 5-card hand plus 3 face-up "Court" cards
- Cards provide special powers: Hearts (Rescue/move pieces), Diamonds (Upgrade/promote), Clubs (Swap pieces), Spades (Strike/remove pieces)
- Advanced mechanics: Power Chains (consecutive same-suit cards get boosted effects), Joust (defend against card attacks)

## Technical Architecture

**Technology Stack (from TECHNICAL_ARCHITECTURE_GUIDE.md):**
- **Frontend**: Vue.js 3 with Composition API
- **Chess Engine**: chess.js (extended for Royal Gambit rules) + chessboard.js/vue-chessboard
- **Backend**: Firebase suite (Realtime Database for active games, Firestore for persistence, Cloud Functions for validation)
- **Deployment**: PWA (Progressive Web App) with Capacitor for mobile wrapper if needed

**Architecture Patterns:**
- Event-driven game state management with event sourcing
- Functional core, imperative shell (pure game logic separate from side effects)
- Modular monorepo structure with npm workspaces

**Project Structure (planned):**
```
royal-gambit/
├── packages/
│   ├── @royal/core/          # Pure game logic
│   ├── @royal/firebase/      # Firebase integration  
│   ├── @royal/ui/            # Vue components
│   └── @royal/pwa/           # PWA app shell
├── apps/
│   ├── web/                  # Main web app
│   └── mobile/               # Capacitor mobile wrapper
└── package.json              # Monorepo root
```

## Development Commands

**Note**: This project is in the planning phase - no code has been implemented yet. Development tooling should be set up according to the technical architecture:

- Vue 3 project setup with TypeScript
- Vitest for unit testing
- Cypress for E2E testing  
- Firebase CLI for backend deployment
- Standard Vue/npm build pipeline

## Key Implementation Notes

**Game Logic Extensions:**
- Extend chess.js with `RoyalGambitGame` class to handle card effects
- Implement card system with validation for each suit's effects
- Power Chain detection for consecutive same-suit card plays
- Joust challenge system for defensive card plays

**State Management:**
- Use Vue 3 Composition API with `useGameState()` composables
- Event sourcing pattern: all game actions as immutable events
- Firebase Realtime Database for live game sync with optimistic updates

**Testing Strategy:**
- Property-based testing for game logic (ensuring board states remain valid)
- Unit tests for all card effects and game rules
- E2E tests for multiplayer synchronization

## Project Goals

**Success Criteria:**
- Collaborative development between Karl and his mother
- Final digital version captures the fun of the physical game
- Asynchronous multiplayer gameplay on iOS devices
- Intuitive interface for both technical and non-technical players

**Target Features:**
- Complete Royal Gambit rule implementation
- Turn-based async play with notifications
- Game state persistence
- Cross-device compatibility (iOS focus)
- Simple feedback collection system for playtesting

## Development Context

This is a personal project with specific stakeholder needs:
- Karl: Technical implementation, limited time availability (couple times per week)
- Mom: Game design authority, playtesting partner, basic iOS device usage

The codebase should prioritize simplicity and maintainability over complex architectures, following the "boring technology" principle outlined in the technical guide.