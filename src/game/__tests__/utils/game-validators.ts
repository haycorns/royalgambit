/**
 * Game validators for ensuring Royal Gambit rule compliance
 * These validators check game state integrity and rule adherence
 */

import { RoyalGambitGame } from '../../RoyalGambitGame'
import type { GameState, Card, CardSuit } from '../../types'

/**
 * Validation result with pass/fail status and details
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Core game state validator
 */
export class GameStateValidator {
  
  /**
   * Validate complete game state against all rules
   */
  validateGameState(game: RoyalGambitGame): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Run all validation checks
    this.validateBoardState(game, result)
    this.validateCardState(game, result)
    this.validatePowerChains(game, result)
    this.validateTurnState(game, result)
    this.validateGameHistory(game, result)

    result.isValid = result.errors.length === 0

    return result
  }

  /**
   * Validate chess board state integrity
   */
  private validateBoardState(game: RoyalGambitGame, result: ValidationResult): void {
    try {
      const board = game.board()
      let whiteKingCount = 0
      let blackKingCount = 0
      let totalPieces = 0

      // Count pieces and validate positions
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file]
          if (piece) {
            totalPieces++
            
            // Validate piece types
            if (!['p', 'r', 'n', 'b', 'q', 'k'].includes(piece.type)) {
              result.errors.push(`Invalid piece type: ${piece.type}`)
            }

            // Validate piece colors
            if (!['w', 'b'].includes(piece.color)) {
              result.errors.push(`Invalid piece color: ${piece.color}`)
            }

            // Count kings
            if (piece.type === 'k') {
              if (piece.color === 'w') whiteKingCount++
              else blackKingCount++
            }
          }
        }
      }

      // Validate piece counts
      if (totalPieces > 32) {
        result.errors.push(`Too many pieces on board: ${totalPieces}`)
      }

      if (whiteKingCount !== 1) {
        result.errors.push(`Invalid white king count: ${whiteKingCount}`)
      }

      if (blackKingCount !== 1) {
        result.errors.push(`Invalid black king count: ${blackKingCount}`)
      }

      // Validate FEN string
      const fen = game.fen()
      if (!fen || fen.split(' ').length !== 6) {
        result.errors.push('Invalid FEN string')
      }

    } catch (error) {
      result.errors.push(`Board validation failed: ${error}`)
    }
  }

  /**
   * Validate card state (hands, court, deck integrity)
   */
  private validateCardState(game: RoyalGambitGame, result: ValidationResult): void {
    try {
      const gameState = game.getGameState()

      // Validate hand sizes
      const whiteHandSize = gameState.hands.white.length
      const blackHandSize = gameState.hands.black.length

      if (whiteHandSize > 5) {
        result.errors.push(`White hand too large: ${whiteHandSize}`)
      }
      
      if (blackHandSize > 5) {
        result.errors.push(`Black hand too large: ${blackHandSize}`)
      }

      // Validate court sizes
      const whiteCourtSize = gameState.courtCards.white.length
      const blackCourtSize = gameState.courtCards.black.length

      if (whiteCourtSize > 3) {
        result.errors.push(`White court too large: ${whiteCourtSize}`)
      }

      if (blackCourtSize > 3) {
        result.errors.push(`Black court too large: ${blackCourtSize}`)
      }

      // Validate individual cards
      this.validateCards([...gameState.hands.white, ...gameState.hands.black], result, 'hands')
      this.validateCards([...gameState.courtCards.white, ...gameState.courtCards.black], result, 'court')

      // Check for duplicate cards
      this.validateNoDuplicateCards(gameState, result)

      // Warn about suboptimal card counts
      if (whiteHandSize < 5 && whiteHandSize > 0) {
        result.warnings.push(`White hand below optimal size: ${whiteHandSize}`)
      }

      if (blackHandSize < 5 && blackHandSize > 0) {
        result.warnings.push(`Black hand below optimal size: ${blackHandSize}`)
      }

    } catch (error) {
      result.errors.push(`Card state validation failed: ${error}`)
    }
  }

  /**
   * Validate individual cards
   */
  private validateCards(cards: Card[], result: ValidationResult, location: string): void {
    for (const card of cards) {
      if (!card.id || typeof card.id !== 'string') {
        result.errors.push(`Invalid card ID in ${location}: ${card.id}`)
      }

      if (!['hearts', 'diamonds', 'clubs', 'spades'].includes(card.suit)) {
        result.errors.push(`Invalid card suit in ${location}: ${card.suit}`)
      }

      if (!['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(card.value)) {
        result.errors.push(`Invalid card value in ${location}: ${card.value}`)
      }

      // Validate ID format matches suit/value
      const expectedId = `${card.suit.charAt(0).toUpperCase()}${card.value}`
      if (card.id !== expectedId) {
        result.errors.push(`Card ID mismatch in ${location}: expected ${expectedId}, got ${card.id}`)
      }
    }
  }

  /**
   * Check for duplicate cards across all game areas
   */
  private validateNoDuplicateCards(gameState: GameState, result: ValidationResult): void {
    const seenCards = new Set<string>()
    const allCards = [
      ...gameState.hands.white,
      ...gameState.hands.black,
      ...gameState.courtCards.white,
      ...gameState.courtCards.black
    ]

    for (const card of allCards) {
      if (seenCards.has(card.id)) {
        result.errors.push(`Duplicate card found: ${card.id}`)
      }
      seenCards.add(card.id)
    }
  }

  /**
   * Validate power chain states
   */
  private validatePowerChains(game: RoyalGambitGame, result: ValidationResult): void {
    try {
      const gameState = game.getGameState()

      // Validate white power chain
      const whitePowerChain = gameState.powerChains.white
      if (whitePowerChain.count < 0) {
        result.errors.push(`Invalid white power chain count: ${whitePowerChain.count}`)
      }

      if (whitePowerChain.count > 10) { // Reasonable upper limit
        result.warnings.push(`Unusually high white power chain count: ${whitePowerChain.count}`)
      }

      // Validate black power chain
      const blackPowerChain = gameState.powerChains.black
      if (blackPowerChain.count < 0) {
        result.errors.push(`Invalid black power chain count: ${blackPowerChain.count}`)
      }

      if (blackPowerChain.count > 10) {
        result.warnings.push(`Unusually high black power chain count: ${blackPowerChain.count}`)
      }

      // Validate power chain suit consistency
      if (whitePowerChain.count > 0 && !whitePowerChain.suit) {
        result.errors.push('White power chain has count but no suit')
      }

      if (blackPowerChain.count > 0 && !blackPowerChain.suit) {
        result.errors.push('Black power chain has count but no suit')
      }

      // Validate last card played consistency
      const lastCardPlayed = gameState.lastCardPlayed
      if (lastCardPlayed) {
        const playerChain = gameState.powerChains[lastCardPlayed.player]
        if (playerChain.count > 0 && playerChain.suit !== lastCardPlayed.card.suit) {
          result.warnings.push('Power chain suit mismatch with last card played')
        }
      }

    } catch (error) {
      result.errors.push(`Power chain validation failed: ${error}`)
    }
  }

  /**
   * Validate turn state and game flow
   */
  private validateTurnState(game: RoyalGambitGame, result: ValidationResult): void {
    try {
      const gameState = game.getGameState()

      // Validate current player
      if (!['white', 'black'].includes(gameState.currentPlayer)) {
        result.errors.push(`Invalid current player: ${gameState.currentPlayer}`)
      }

      // Check chess turn consistency
      const chessTurn = game.turn()
      const expectedTurn = gameState.currentPlayer === 'white' ? 'w' : 'b'
      if (chessTurn !== expectedTurn) {
        result.warnings.push(`Chess turn (${chessTurn}) doesn't match game player (${gameState.currentPlayer})`)
      }

      // Validate game hasn't ended incorrectly
      if (game.isGameOver()) {
        if (!game.isCheckmate() && !game.isStalemate() && !game.isDraw()) {
          result.warnings.push('Game is over but not for standard chess reasons')
        }
      }

    } catch (error) {
      result.errors.push(`Turn state validation failed: ${error}`)
    }
  }

  /**
   * Validate game history and event log
   */
  private validateGameHistory(game: RoyalGambitGame, result: ValidationResult): void {
    try {
      const gameState = game.getGameState()
      const history = gameState.moveHistory

      // Validate event types
      for (const event of history) {
        if (!['move', 'card'].includes(event.type)) {
          result.errors.push(`Invalid event type: ${event.type}`)
        }

        if (!['white', 'black'].includes(event.player)) {
          result.errors.push(`Invalid event player: ${event.player}`)
        }

        if (typeof event.timestamp !== 'number' || event.timestamp <= 0) {
          result.errors.push(`Invalid event timestamp: ${event.timestamp}`)
        }
      }

      // Check chronological order
      for (let i = 1; i < history.length; i++) {
        if (history[i].timestamp < history[i-1].timestamp) {
          result.warnings.push(`Events not in chronological order at index ${i}`)
        }
      }

    } catch (error) {
      result.errors.push(`Game history validation failed: ${error}`)
    }
  }
}

/**
 * Rule-specific validators for Royal Gambit mechanics
 */
export class RuleValidator {

  /**
   * Validate that card effects are applied correctly
   */
  validateCardEffect(
    game: RoyalGambitGame, 
    cardId: string, 
    target: string | undefined, 
    expectedEffect: string
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // This would be implemented with specific effect validation logic
    // For now, placeholder validation

    return result
  }

  /**
   * Validate power chain activation
   */
  validatePowerChainActivation(
    previousState: GameState,
    currentState: GameState,
    cardSuit: CardSuit
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    const currentPlayer = currentState.currentPlayer
    const prevChain = previousState.powerChains[currentPlayer]
    const currChain = currentState.powerChains[currentPlayer]

    // Check if power chain should have activated
    if (prevChain.suit === cardSuit && prevChain.count >= 1) {
      if (currChain.count !== prevChain.count + 1) {
        result.errors.push(`Power chain count should have increased from ${prevChain.count} to ${prevChain.count + 1}`)
      }

      if (currChain.suit !== cardSuit) {
        result.errors.push(`Power chain suit should remain ${cardSuit}`)
      }
    }

    return result
  }

  /**
   * Validate joust mechanics
   */
  validateJoust(
    attackCard: Card,
    defendCard: Card,
    expectedWinner: 'attacker' | 'defender' | 'tie'
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    const attackValue = this.getCardValue(attackCard)
    const defendValue = this.getCardValue(defendCard)

    let actualWinner: 'attacker' | 'defender' | 'tie'
    if (attackValue > defendValue) {
      actualWinner = 'attacker'
    } else if (defendValue > attackValue) {
      actualWinner = 'defender'
    } else {
      actualWinner = 'tie'
    }

    if (actualWinner !== expectedWinner) {
      result.errors.push(`Expected ${expectedWinner} to win joust, but ${actualWinner} won`)
    }

    return result
  }

  /**
   * Get numeric value of card for comparison
   */
  private getCardValue(card: Card): number {
    const valueMap: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
    return valueMap[card.value] || 0
  }
}

/**
 * Performance validator for checking game responsiveness
 */
export class PerformanceValidator {

  /**
   * Validate that operations complete within time limits
   */
  validatePerformance<T>(
    operation: () => T,
    maxTimeMs: number,
    operationName: string
  ): ValidationResult & { result?: T, actualTimeMs: number } {
    const startTime = performance.now()
    let result: T | undefined
    let error: Error | undefined

    try {
      result = operation()
    } catch (e) {
      error = e as Error
    }

    const actualTimeMs = performance.now() - startTime

    return {
      isValid: !error && actualTimeMs <= maxTimeMs,
      errors: error ? [`${operationName} failed: ${error.message}`] : 
              actualTimeMs > maxTimeMs ? [`${operationName} too slow: ${actualTimeMs}ms > ${maxTimeMs}ms`] : [],
      warnings: actualTimeMs > maxTimeMs * 0.8 ? [`${operationName} approaching time limit: ${actualTimeMs}ms`] : [],
      result,
      actualTimeMs
    }
  }

  /**
   * Validate memory usage doesn't grow excessively
   */
  validateMemoryUsage(
    operation: () => void,
    maxMemoryIncreaseMB: number
  ): ValidationResult & { memoryIncreaseMB: number } {
    // Note: This is a simplified version. Real memory measurement would need more sophisticated tools
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    operation()
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
    const memoryIncreaseMB = (finalMemory - initialMemory) / (1024 * 1024)

    return {
      isValid: memoryIncreaseMB <= maxMemoryIncreaseMB,
      errors: memoryIncreaseMB > maxMemoryIncreaseMB ? 
        [`Memory increase too high: ${memoryIncreaseMB}MB > ${maxMemoryIncreaseMB}MB`] : [],
      warnings: memoryIncreaseMB > maxMemoryIncreaseMB * 0.8 ? 
        [`Memory increase approaching limit: ${memoryIncreaseMB}MB`] : [],
      memoryIncreaseMB
    }
  }
}

// Export validator instances
export const gameStateValidator = new GameStateValidator()
export const ruleValidator = new RuleValidator()
export const performanceValidator = new PerformanceValidator()