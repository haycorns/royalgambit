# Royal Gambit: Technical Architecture Guide

## Technology Stack Decision

### Core: Vue.js 3 + Composition API

**Vue.js 3** provides the perfect balance of simplicity and power for Royal Gambit. The Composition API offers functional programming patterns you prefer, with reactive state management that naturally fits turn-based games. Vue's gentle learning curve means faster development compared to React, while maintaining professional capabilities. The ecosystem is mature, stable, and well-documented - epitomizing "boring technology" that just works.

```javascript
// Example: Functional game state composition
import { ref, computed, readonly } from 'vue'

export function useGameState() {
  const boardState = ref(initialBoardState())
  const playerHand = ref([])
  const courtCards = ref([])
  
  const availableMoves = computed(() => 
    calculateLegalMoves(boardState.value, playerHand.value)
  )
  
  function playCard(card) {
    // Pure function returns new state
    const newState = applyCardEffect(boardState.value, card)
    boardState.value = newState
  }
  
  return {
    boardState: readonly(boardState),
    availableMoves,
    playCard
  }
}
```

### Chess Engine: chess.js + chessboard.js

**Chess.js** handles all chess logic with a battle-tested implementation used by both Lichess and Chess.com. It provides move validation, check/checkmate detection, and PGN/FEN support. **Chessboard.js** or **vue-chessboard** provides the visual board with drag-and-drop functionality.

```javascript
// Extending chess.js for Royal Gambit rules
import { Chess } from 'chess.js'

class RoyalGambitGame extends Chess {
  constructor() {
    super()
    this.courtCards = { white: [], black: [] }
    this.powerChainCount = { white: 0, black: 0 }
  }
  
  playCard(card, targetSquare) {
    switch(card.suit) {
      case 'hearts':
        return this.rescueMove(card, targetSquare)
      case 'spades':
        return this.strikeMove(card, targetSquare)
      // ... other card effects
    }
  }
  
  rescueMove(card, targetSquare) {
    // Override normal chess rules for Hearts cards
    const piece = this.remove(card.fromSquare)
    this.put(piece, targetSquare)
    return this.fen() // Return new board state
  }
}
```

### Backend: Firebase Suite

**Firebase Realtime Database** for active game sessions (optimized for bandwidth-based pricing in turn-based games):
- 100 concurrent connections free
- ~500 concurrent games at $25/month
- Automatic offline sync and conflict resolution

**Cloud Firestore** for persistent data:
- User profiles and statistics
- Match history and replays
- Card collection data

**Cloud Functions** for server-side validation:
- Move verification to prevent cheating
- ELO rating calculations
- Matchmaking logic

```javascript
// Firebase game state structure
const gameState = {
  gameId: 'uuid-here',
  players: {
    white: 'userId1',
    black: 'userId2'
  },
  currentTurn: 'white',
  boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
  hands: {
    white: ['H5', 'D2', 'S9', 'C3', 'HK'],
    black: ['S4', 'D7', 'H8', 'CQ', 'DA']
  },
  courtCards: {
    white: ['H3', 'SK', 'D5'],
    black: ['C7', 'H2', 'DQ']
  },
  powerChains: {
    white: { suit: null, count: 0 },
    black: { suit: null, count: 0 }
  },
  moveHistory: [],
  lastUpdate: 'timestamp'
}
```

## Architecture Patterns

### Event-Driven Game State Management

Implement an event-sourcing pattern where every action is an immutable event. This provides complete game history, natural undo/redo, and simplified multiplayer sync:

```javascript
// stores/gameEvents.js
export const useGameEvents = defineStore('gameEvents', () => {
  const events = ref([])
  
  const currentState = computed(() => 
    events.value.reduce((state, event) => 
      applyEvent(state, event), initialGameState()
    )
  )
  
  async function dispatchEvent(event) {
    // Validate event
    if (!validateEvent(event, currentState.value)) {
      throw new Error('Invalid game event')
    }
    
    // Apply locally (optimistic update)
    events.value.push(event)
    
    // Sync to Firebase
    await firebase.database()
      .ref(`games/${gameId}/events`)
      .push(event)
  }
  
  return { events, currentState, dispatchEvent }
})
```

### Functional Core, Imperative Shell

Keep game logic pure and testable while isolating side effects:

```javascript
// Core game logic (pure functions)
export function calculateCardEffect(boardState, card, target) {
  // Pure function - no side effects
  const newState = { ...boardState }
  
  switch(card.suit) {
    case 'hearts':
      newState.pieces = moveToEmptySquare(newState.pieces, target)
      break
    case 'diamonds':
      newState.pieces = promotePawn(newState.pieces, target)
      break
    // ... other effects
  }
  
  return newState
}

// Vue component (imperative shell)
export default {
  setup() {
    const { boardState, playCard } = useGameState()
    
    async function handleCardPlay(card, target) {
      try {
        // Calculate pure game logic
        const newState = calculateCardEffect(boardState.value, card, target)
        
        // Handle side effects
        await syncToFirebase(newState)
        showAnimation(card, target)
        playSound('cardPlayed')
        
        // Update local state
        boardState.value = newState
      } catch (error) {
        showError(error)
      }
    }
    
    return { handleCardPlay }
  }
}
```

### Modular Package Structure

Organize code into focused npm packages for maximum modularity:

```
royal-gambit/
├── packages/
│   ├── @royal/core/          # Pure game logic
│   │   ├── chess-engine/
│   │   ├── card-system/
│   │   └── game-rules/
│   ├── @royal/firebase/      # Firebase integration
│   │   ├── realtime-sync/
│   │   ├── auth/
│   │   └── cloud-functions/
│   ├── @royal/ui/            # Vue components
│   │   ├── board/
│   │   ├── cards/
│   │   └── game-controls/
│   └── @royal/pwa/           # PWA app shell
├── apps/
│   ├── web/                  # Main web app
│   └── mobile/               # Capacitor mobile wrapper
└── package.json              # Monorepo root
```

## Infrastructure Setup

### Authentication & User Management

Firebase Authentication with mandatory email/password plus optional social logins:

```javascript
// composables/useAuth.js
export function useAuth() {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  
  async function signIn(email, password) {
    const { user: firebaseUser } = await firebase.auth()
      .signInWithEmailAndPassword(email, password)
    
    user.value = await fetchUserProfile(firebaseUser.uid)
  }
  
  async function playAsGuest() {
    const { user: firebaseUser } = await firebase.auth()
      .signInAnonymously()
    
    user.value = {
      uid: firebaseUser.uid,
      isGuest: true,
      displayName: `Guest_${generateRandomId()}`
    }
  }
  
  return { user, isAuthenticated, signIn, playAsGuest }
}
```

### Real-time Multiplayer Sync

Firebase Realtime Database with optimistic updates and conflict resolution:

```javascript
// services/multiplayerSync.js
class MultiplayerSync {
  constructor(gameId) {
    this.gameRef = firebase.database().ref(`games/${gameId}`)
    this.localEvents = []
    this.serverEvents = []
  }
  
  async syncMove(move) {
    // Optimistic local update
    this.localEvents.push(move)
    this.onMoveReceived(move)
    
    try {
      // Push to server
      await this.gameRef.child('moves').push({
        ...move,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      })
    } catch (error) {
      // Rollback on failure
      this.localEvents.pop()
      this.resyncWithServer()
    }
  }
  
  listenForOpponentMoves() {
    this.gameRef.child('moves').on('child_added', (snapshot) => {
      const move = snapshot.val()
      
      // Ignore our own moves (already applied optimistically)
      if (!this.localEvents.find(m => m.id === move.id)) {
        this.onMoveReceived(move)
      }
    })
  }
}
```

### Progressive Web App Deployment

Configure Vue PWA plugin for app-like experience:

```javascript
// vue.config.js
module.exports = {
  pwa: {
    name: 'Royal Gambit',
    themeColor: '#8B4513',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    manifestOptions: {
      background_color: '#F5DEB3',
      display: 'standalone',
      orientation: 'portrait'
    },
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'game-assets',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 86400 * 30 // 30 days
            }
          }
        }
      ]
    }
  }
}
```

## Testing Strategy

### Unit Testing with Vitest

Test pure game logic with property-based testing:

```javascript
// tests/gameLogic.spec.js
import { describe, it, expect } from 'vitest'
import { fc } from 'fast-check'

describe('Royal Gambit Game Logic', () => {
  it('should never exceed initial piece count', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          type: fc.constantFrom('move', 'card'),
          data: fc.anything()
        })),
        (events) => {
          const finalState = events.reduce(applyEvent, initialState)
          const pieceCount = countPieces(finalState.board)
          expect(pieceCount).toBeLessThanOrEqual(32)
        }
      )
    )
  })
  
  it('should maintain valid board state after any card effect', () => {
    fc.assert(
      fc.property(
        validBoardState(),
        validCard(),
        validTarget(),
        (board, card, target) => {
          const newBoard = applyCardEffect(board, card, target)
          expect(isValidBoardState(newBoard)).toBe(true)
        }
      )
    )
  })
})
```

### E2E Testing with Cypress

Test complete game flows including multiplayer:

```javascript
// cypress/e2e/multiplayer.cy.js
describe('Multiplayer Game', () => {
  it('synchronizes moves between players', () => {
    // Player 1 window
    cy.visit('/game/test-game-id')
    cy.login('player1@test.com', 'password')
    
    // Player 2 window
    cy.openNewWindow()
    cy.visit('/game/test-game-id')
    cy.login('player2@test.com', 'password')
    
    // Player 1 makes a move
    cy.switchToWindow(0)
    cy.get('[data-square="e2"]').drag('[data-square="e4"]')
    
    // Verify move appears for Player 2
    cy.switchToWindow(1)
    cy.get('[data-square="e4"]')
      .should('contain', 'pawn')
      .and('have.class', 'white-piece')
  })
})
```

## Implementation Timeline

### Phase 1: Core Game Engine (Weeks 1-2)
- Set up Vue 3 project with TypeScript
- Integrate chess.js and create RoyalGambitGame class
- Implement basic board rendering with vue-chessboard
- Create card system with all four suit effects

### Phase 2: Advanced Mechanics (Weeks 3-4)
- Implement Power Chains logic
- Add Joust challenge system
- Create Court cards display and functionality
- Build comprehensive test suite for game rules

### Phase 3: Firebase Integration (Weeks 5-6)
- Set up Firebase project with dual database strategy
- Implement authentication with email and guest accounts
- Create real-time game synchronization
- Add Cloud Functions for move validation

### Phase 4: Multiplayer Features (Weeks 7-8)
- Build matchmaking system with ELO ratings
- Implement game lobby and invitations
- Add spectator mode
- Create reconnection logic for dropped connections

### Phase 5: PWA & Polish (Weeks 9-10)
- Configure PWA with offline support
- Add animations and sound effects
- Implement responsive design for all screen sizes
- Create tutorial and help system

### Phase 6: Testing & Launch (Weeks 11-12)
- Comprehensive testing across devices
- Performance optimization
- Beta testing with family
- Deploy to production hosting

## Cost Analysis

### Development Phase
- **Domain & Hosting**: $15/month (Vercel/Netlify)
- **Firebase**: Free tier (sufficient for development)
- **Total**: $15/month

### Production (1,000 Daily Active Users)
- **Firebase Realtime Database**: $25/month
- **Cloud Firestore**: $10/month (user profiles, match history)
- **Cloud Functions**: $5/month (minimal usage)
- **Hosting**: $20/month (Vercel Pro)
- **Total**: ~$60/month

### Scaling Costs
- 10,000 DAU: ~$200/month
- 100,000 DAU: ~$1,500/month
- Costs scale linearly with usage, no surprise bills

## Key Architectural Decisions

**Vue.js over React**: Vue's simpler mental model and gentler learning curve accelerate development while the Composition API provides the functional patterns you prefer.

**Firebase over custom backend**: Eliminates backend development complexity, provides battle-tested infrastructure, and includes offline support out of the box.

**PWA over native**: Instant updates without app store approval, single codebase for all platforms, and native app features when needed through Capacitor.

**chess.js extension over custom engine**: Leverages proven chess logic while allowing Royal Gambit-specific modifications through inheritance.

**Event sourcing over direct state mutation**: Provides complete game history, natural undo/redo, and simplified multiplayer synchronization.

**Monorepo with npm workspaces**: Enables code sharing between packages while maintaining clear separation of concerns.

This architecture prioritizes simplicity, proven patterns, and rapid development while maintaining the flexibility to scale from prototype to production. The "boring technology" choices ensure long-term maintainability and extensive community support throughout the project lifecycle.
