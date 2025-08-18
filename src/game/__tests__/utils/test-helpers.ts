/**
 * Test helpers for Royal Gambit game testing
 * Provides common operations for setting up game states and performing actions
 */

import { RoyalGambitGame } from '../../RoyalGambitGame'
import { CardSystem } from '../../CardSystem'
import type { Card, CardSuit, GameState } from '../../types'

/**
 * Create a fresh game instance with default setup
 */
export function createFreshGame(): RoyalGambitGame {
  return new RoyalGambitGame()
}

/**
 * Create a game instance and move to a specific turn number
 */
export function createGameAtTurn(turnNumber: number): RoyalGambitGame {
  const game = new RoyalGambitGame()
  
  // Make alternating moves to reach desired turn
  const moves = [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5'],
    ['d2', 'd3'], ['d7', 'd6']
  ]
  
  for (let i = 0; i < Math.min(turnNumber - 1, moves.length); i++) {
    const [from, to] = moves[i]
    game.makeChessMove(from, to)
  }
  
  return game
}

/**
 * Set up a game with specific cards in a player's hand
 */
export function createGameWithCards(player: 'white' | 'black', cardIds: string[]): RoyalGambitGame {
  const game = new RoyalGambitGame()
  const gameState = game.getGameState()
  const cardSystem = new CardSystem()
  
  // Clear existing hand and add specified cards
  gameState.hands[player] = []
  for (const cardId of cardIds) {
    const card = cardSystem.createCard(cardId)
    if (card) {
      gameState.hands[player].push(card)
    }
  }
  
  return game
}

/**
 * Set up a game with specific court cards
 */
export function createGameWithCourtCards(player: 'white' | 'black', cardIds: string[]): RoyalGambitGame {
  const game = new RoyalGambitGame()
  const gameState = game.getGameState()
  const cardSystem = new CardSystem()
  
  // Clear existing court and add specified cards
  gameState.courtCards[player] = []
  for (const cardId of cardIds) {
    const card = cardSystem.createCard(cardId)
    if (card) {
      gameState.courtCards[player].push(card)
    }
  }
  
  return game
}

/**
 * Create a game with an active power chain
 */
export function createGameWithPowerChain(player: 'white' | 'black', suit: CardSuit, count: number): RoyalGambitGame {
  const game = new RoyalGambitGame()
  const gameState = game.getGameState()
  
  // Set up power chain state
  gameState.powerChains[player] = { suit, count }
  gameState.lastCardPlayed = {
    player,
    card: { suit, value: 'A' as any, id: 'test' }
  }
  
  return game
}

/**
 * Create a game with the king in check
 */
export function createGameWithCheck(kingColor: 'white' | 'black'): RoyalGambitGame {
  const game = new RoyalGambitGame()
  
  if (kingColor === 'white') {
    // Set up a position where white king is in check
    game.load('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 2')
    game.makeChessMove('d1', 'h5') // Queen attacks king area
    game.makeChessMove('f7', 'f6') // Black moves
    game.makeChessMove('h5', 'e8') // Check!
  } else {
    // Set up a position where black king is in check
    game.load('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3')
    game.makeChessMove('f3', 'g5') // Attack f7
    game.makeChessMove('f7', 'f6')
    game.makeChessMove('d1', 'h5') // Check!
  }
  
  return game
}

/**
 * Create a game with checkmate position
 */
export function createGameWithCheckmate(): RoyalGambitGame {
  const game = new RoyalGambitGame()
  
  // Famous fool's mate
  game.makeChessMove('f2', 'f3')
  game.makeChessMove('e7', 'e5')
  game.makeChessMove('g2', 'g4')
  game.makeChessMove('d8', 'h4') // Checkmate!
  
  return game
}

/**
 * Create a game with specific board position from FEN
 */
export function createGameFromFEN(fen: string): RoyalGambitGame {
  const game = new RoyalGambitGame()
  game.load(fen)
  return game
}

/**
 * Play a sequence of moves for testing
 */
export function playMoveSequence(game: RoyalGambitGame, moves: Array<[string, string]>): void {
  for (const [from, to] of moves) {
    const success = game.makeChessMove(from, to)
    if (!success) {
      throw new Error(`Failed to make move ${from}-${to}`)
    }
  }
}

/**
 * Play a sequence of cards for testing
 */
export function playCardSequence(game: RoyalGambitGame, cards: Array<{cardId: string, target?: string, fromCourt?: boolean}>): void {
  for (const {cardId, target, fromCourt} of cards) {
    const success = game.playCard(cardId, target, fromCourt)
    if (!success) {
      throw new Error(`Failed to play card ${cardId}`)
    }
  }
}

/**
 * Fast-forward game to specific state with minimal moves
 */
export function fastForwardToMidGame(): RoyalGambitGame {
  const game = new RoyalGambitGame()
  
  const moves: Array<[string, string]> = [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5'],
    ['d2', 'd3'], ['d7', 'd6'],
    ['b1', 'c3'], ['g8', 'f6'],
    ['c1', 'g5'], ['c8', 'g4']
  ]
  
  playMoveSequence(game, moves)
  return game
}

/**
 * Create game with empty deck scenario
 */
export function createGameWithEmptyDeck(): RoyalGambitGame {
  const game = new RoyalGambitGame()
  
  // Simulate empty deck by playing many cards
  // This is a simplified version - in real implementation,
  // we'd need to exhaust the deck through gameplay
  
  return game
}

/**
 * Create test card with specific properties
 */
export function createTestCard(suit: CardSuit, value: string): Card {
  const cardSystem = new CardSystem()
  const suitChar = suit.charAt(0).toUpperCase()
  return cardSystem.createCard(`${suitChar}${value}`)!
}

/**
 * Create a complete deck for testing
 */
export function createTestDeck(): Card[] {
  const cardSystem = new CardSystem()
  const deck: Card[] = []
  
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  
  for (const suit of suits) {
    for (const value of values) {
      const card = createTestCard(suit, value)
      deck.push(card)
    }
  }
  
  return deck
}

/**
 * Simulate multiple rounds of gameplay
 */
export function simulateGameRounds(rounds: number): RoyalGambitGame {
  const game = new RoyalGambitGame()
  
  for (let i = 0; i < rounds; i++) {
    // Alternate between chess moves and card plays
    if (i % 2 === 0) {
      // Try a simple pawn move
      const moves = [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd5'],
        ['f2', 'f4'], ['f7', 'f5'],
        ['g2', 'g4'], ['g7', 'g5']
      ]
      
      const moveIndex = Math.floor(i / 2) % moves.length
      const [from, to] = moves[moveIndex]
      game.makeChessMove(from, to)
    } else {
      // Try to play a card if available
      const hand = game.getCurrentPlayerHand()
      if (hand.length > 0) {
        // Play first available card with default target
        game.playCard(hand[0].id, 'e4')
      }
    }
  }
  
  return game
}

/**
 * Assert game state meets basic invariants
 */
export function assertGameInvariants(game: RoyalGambitGame): void {
  // Basic board state
  const board = game.board()
  let whiteKingCount = 0
  let blackKingCount = 0
  let totalPieces = 0
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      if (piece) {
        totalPieces++
        if (piece.type === 'k') {
          if (piece.color === 'w') whiteKingCount++
          else blackKingCount++
        }
      }
    }
  }
  
  if (whiteKingCount !== 1 || blackKingCount !== 1) {
    throw new Error(`Invalid king count: white=${whiteKingCount}, black=${blackKingCount}`)
  }
  
  if (totalPieces > 32) {
    throw new Error(`Too many pieces on board: ${totalPieces}`)
  }
  
  // Card state
  const gameState = game.getGameState()
  const whiteCardCount = gameState.hands.white.length + gameState.courtCards.white.length
  const blackCardCount = gameState.hands.black.length + gameState.courtCards.black.length
  
  if (whiteCardCount > 8 || blackCardCount > 8) {
    throw new Error(`Too many cards: white=${whiteCardCount}, black=${blackCardCount}`)
  }
  
  // Power chain consistency
  const whitePowerChain = gameState.powerChains.white
  const blackPowerChain = gameState.powerChains.black
  
  if (whitePowerChain.count < 0 || blackPowerChain.count < 0) {
    throw new Error('Invalid power chain count')
  }
}

/**
 * Get all possible chess moves for current position
 */
export function getAllLegalMoves(game: RoyalGambitGame): string[] {
  const moves = game.moves({ verbose: true })
  return moves.map(move => `${move.from}-${move.to}`)
}

/**
 * Check if a specific move is legal
 */
export function isMoveLegal(game: RoyalGambitGame, from: string, to: string): boolean {
  const moves = game.moves({ verbose: true })
  return moves.some(move => move.from === from && move.to === to)
}

/**
 * Generate random valid card for testing
 */
export function generateRandomCard(): Card {
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  
  const randomSuit = suits[Math.floor(Math.random() * suits.length)]
  const randomValue = values[Math.floor(Math.random() * values.length)]
  
  return createTestCard(randomSuit, randomValue)
}