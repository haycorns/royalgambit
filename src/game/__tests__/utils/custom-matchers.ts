/**
 * Custom Jest/Vitest matchers for Royal Gambit game testing
 * These matchers provide game-specific assertions for cleaner, more readable tests
 */

import { expect } from 'vitest'
import type { MatcherResult } from 'vitest'
import { RoyalGambitGame } from '../../RoyalGambitGame'
import type { Card, CardSuit } from '../../types'

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveValidBoardState(): T
    toAllowMove(from: string, to: string): T
    toHaveCard(cardId: string): T
    toHaveCardsInHand(count: number): T
    toHaveCardsInCourt(count: number): T
    toBeInPowerChain(suit: CardSuit): T
    toHavePowerChainCount(count: number): T
    toBePlayerTurn(player: 'white' | 'black'): T
    toHaveValidGameState(): T
    toAllowCardPlay(cardId: string, target?: string): T
    toBeInCheck(): T
    toBeInCheckmate(): T
    toHaveKingAt(square: string): T
    toHavePieceCount(count: number): T
  }
}

/**
 * Check if the game has a valid chess board state
 */
function toHaveValidBoardState(received: RoyalGambitGame): MatcherResult {
  try {
    // Test basic chess rules
    const fen = received.fen()
    const isValid = fen && fen.split(' ').length === 6
    
    // Count pieces to ensure no overflow
    const board = received.board()
    let totalPieces = 0
    let whiteKings = 0
    let blackKings = 0
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece) {
          totalPieces++
          if (piece.type === 'k') {
            if (piece.color === 'w') whiteKings++
            else blackKings++
          }
        }
      }
    }
    
    const hasValidPieceCount = totalPieces <= 32
    const hasValidKings = whiteKings === 1 && blackKings === 1
    
    const pass = isValid && hasValidPieceCount && hasValidKings
    
    return {
      pass,
      message: () => pass 
        ? `Expected board state to be invalid`
        : `Expected valid board state but got: ${!isValid ? 'invalid FEN' : !hasValidPieceCount ? `too many pieces (${totalPieces})` : 'missing or duplicate kings'}`
    }
  } catch (error) {
    return {
      pass: false,
      message: () => `Board state validation failed: ${error}`
    }
  }
}

/**
 * Check if a chess move is allowed
 */
function toAllowMove(received: RoyalGambitGame, from: string, to: string): MatcherResult {
  try {
    // Create a copy to test the move without affecting the original
    const testGame = new RoyalGambitGame()
    testGame.load(received.fen())
    
    const moveResult = testGame.move({ from, to })
    const pass = moveResult !== null
    
    return {
      pass,
      message: () => pass
        ? `Expected move ${from}-${to} to be invalid`
        : `Expected move ${from}-${to} to be valid`
    }
  } catch (error) {
    return {
      pass: false,
      message: () => `Move validation failed: ${error}`
    }
  }
}

/**
 * Check if player has a specific card
 */
function toHaveCard(received: RoyalGambitGame, cardId: string): MatcherResult {
  const gameState = received.getGameState()
  const currentPlayer = gameState.currentPlayer
  const hand = gameState.hands[currentPlayer]
  const court = gameState.courtCards[currentPlayer]
  
  const hasCard = [...hand, ...court].some(card => card.id === cardId)
  
  return {
    pass: hasCard,
    message: () => hasCard
      ? `Expected player ${currentPlayer} not to have card ${cardId}`
      : `Expected player ${currentPlayer} to have card ${cardId}`
  }
}

/**
 * Check card count in hand
 */
function toHaveCardsInHand(received: RoyalGambitGame, count: number): MatcherResult {
  const hand = received.getCurrentPlayerHand()
  const actualCount = hand.length
  
  return {
    pass: actualCount === count,
    message: () => `Expected ${count} cards in hand, but got ${actualCount}`
  }
}

/**
 * Check card count in court
 */
function toHaveCardsInCourt(received: RoyalGambitGame, count: number): MatcherResult {
  const court = received.getCurrentPlayerCourt()
  const actualCount = court.length
  
  return {
    pass: actualCount === count,
    message: () => `Expected ${count} cards in court, but got ${actualCount}`
  }
}

/**
 * Check if player is in a power chain of specific suit
 */
function toBeInPowerChain(received: RoyalGambitGame, suit: CardSuit): MatcherResult {
  // Check both players' power chains to find the active one
  const whitePowerChain = received.getPowerChainStatus('white')
  const blackPowerChain = received.getPowerChainStatus('black')
  
  const whiteInChain = whitePowerChain.suit === suit && whitePowerChain.count >= 2
  const blackInChain = blackPowerChain.suit === suit && blackPowerChain.count >= 2
  const pass = whiteInChain || blackInChain
  
  return {
    pass,
    message: () => pass
      ? `Expected not to be in ${suit} power chain`
      : `Expected to be in ${suit} power chain, but got white: ${whitePowerChain.suit}(${whitePowerChain.count}), black: ${blackPowerChain.suit}(${blackPowerChain.count})`
  }
}

/**
 * Check power chain count
 */
function toHavePowerChainCount(received: RoyalGambitGame, count: number): MatcherResult {
  // Check both players' power chains to find the maximum count
  const whitePowerChain = received.getPowerChainStatus('white')
  const blackPowerChain = received.getPowerChainStatus('black')
  
  const maxCount = Math.max(whitePowerChain.count, blackPowerChain.count)
  
  return {
    pass: maxCount === count,
    message: () => `Expected power chain count ${count}, but got white: ${whitePowerChain.count}, black: ${blackPowerChain.count} (max: ${maxCount})`
  }
}

/**
 * Check whose turn it is
 */
function toBePlayerTurn(received: RoyalGambitGame, player: 'white' | 'black'): MatcherResult {
  const gameState = received.getGameState()
  const currentPlayer = gameState.currentPlayer
  
  return {
    pass: currentPlayer === player,
    message: () => `Expected ${player}'s turn, but it's ${currentPlayer}'s turn`
  }
}

/**
 * Check if game state follows all invariants
 */
function toHaveValidGameState(received: RoyalGambitGame): MatcherResult {
  try {
    const gameState = received.getGameState()
    
    // Check card counts
    const whiteHandCount = gameState.hands.white.length
    const blackHandCount = gameState.hands.black.length
    const whiteCourtCount = gameState.courtCards.white.length
    const blackCourtCount = gameState.courtCards.black.length
    
    const validCardCounts = whiteHandCount <= 5 && blackHandCount <= 5 &&
                           whiteCourtCount <= 3 && blackCourtCount <= 3
    
    // Check board state
    const validBoard = received.fen() !== null
    
    // Check power chain consistency
    const whitePowerChain = gameState.powerChains.white
    const blackPowerChain = gameState.powerChains.black
    const validPowerChains = whitePowerChain.count >= 0 && blackPowerChain.count >= 0
    
    const pass = validCardCounts && validBoard && validPowerChains
    
    return {
      pass,
      message: () => pass
        ? `Expected invalid game state`
        : `Game state validation failed: ${!validCardCounts ? 'invalid card counts' : !validBoard ? 'invalid board' : 'invalid power chains'}`
    }
  } catch (error) {
    return {
      pass: false,
      message: () => `Game state validation failed: ${error}`
    }
  }
}

/**
 * Check if card can be played
 */
function toAllowCardPlay(received: RoyalGambitGame, cardId: string, target?: string): MatcherResult {
  try {
    // Create a copy to test without affecting original
    const testGame = new RoyalGambitGame()
    testGame.load(received.fen())
    
    const result = testGame.playCard(cardId, target)
    
    return {
      pass: result,
      message: () => result
        ? `Expected card play ${cardId} to fail`
        : `Expected card play ${cardId} to succeed`
    }
  } catch (error) {
    return {
      pass: false,
      message: () => `Card play validation failed: ${error}`
    }
  }
}

/**
 * Check if current player is in check
 */
function toBeInCheck(received: RoyalGambitGame): MatcherResult {
  const inCheck = received.inCheck()
  
  return {
    pass: inCheck,
    message: () => inCheck
      ? `Expected not to be in check`
      : `Expected to be in check`
  }
}

/**
 * Check if current player is in checkmate
 */
function toBeInCheckmate(received: RoyalGambitGame): MatcherResult {
  const inCheckmate = received.isCheckmate()
  
  return {
    pass: inCheckmate,
    message: () => inCheckmate
      ? `Expected not to be in checkmate`
      : `Expected to be in checkmate`
  }
}

/**
 * Check if king is at specific square
 */
function toHaveKingAt(received: RoyalGambitGame, square: string): MatcherResult {
  const board = received.board()
  let kingFound = false
  
  // Convert square notation to board coordinates
  const file = square.charCodeAt(0) - 97 // a=0, b=1, etc.
  const rank = 8 - parseInt(square.charAt(1)) // 8=0, 7=1, etc.
  
  if (rank >= 0 && rank < 8 && file >= 0 && file < 8) {
    const piece = board[rank][file]
    kingFound = piece && piece.type === 'k'
  }
  
  return {
    pass: kingFound,
    message: () => kingFound
      ? `Expected no king at ${square}`
      : `Expected king at ${square}`
  }
}

/**
 * Check total piece count on board
 */
function toHavePieceCount(received: RoyalGambitGame, count: number): MatcherResult {
  const board = received.board()
  let actualCount = 0
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      if (board[rank][file]) {
        actualCount++
      }
    }
  }
  
  return {
    pass: actualCount === count,
    message: () => `Expected ${count} pieces on board, but got ${actualCount}`
  }
}

// Register all custom matchers
expect.extend({
  toHaveValidBoardState,
  toAllowMove,
  toHaveCard,
  toHaveCardsInHand,
  toHaveCardsInCourt,
  toBeInPowerChain,
  toHavePowerChainCount,
  toBePlayerTurn,
  toHaveValidGameState,
  toAllowCardPlay,
  toBeInCheck,
  toBeInCheckmate,
  toHaveKingAt,
  toHavePieceCount
})