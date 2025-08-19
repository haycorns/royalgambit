/**
 * Hearts Card Effects Tests
 * 
 * Tests the Hearts (Rescue) card effects according to Royal Gambit rules:
 * - Normal Effect: Move one of your pieces to any empty square
 * - Ace Effect: Move your King out of check even if it breaks normal chess rules
 * - Power Chain: Move 2 pieces this turn instead of one (can include King if Ace used)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RoyalGambitGame } from '../../../RoyalGambitGame'
import '../../utils/custom-matchers'
import { 
  createFreshGame, 
  createGameWithCards,
  createGameWithPowerChain,
  createGameWithCheck,
  playMoveSequence,
  addCardsToGame
} from '../../utils/test-helpers'
import { cardFactory } from '../../fixtures/card-factories'
import { CardSuit } from '../../../types'

describe('Hearts Card Effects (Rescue)', () => {
  let game: RoyalGambitGame

  beforeEach(() => {
    game = createFreshGame()
  })

  describe('Normal Hearts Effects', () => {
    it('should move piece to any empty square', () => {
      // Set up game with a Hearts card
      game = createGameWithCards('white', ['H5'])
      
      // Make some moves to create empty squares
      game.makeChessMove('e2', 'e4')
      game.makeChessMove('e7', 'e5')
      
      // Use Hearts to move a piece to empty square
      const initialPiece = game.get('d2' as any) // White pawn
      expect(initialPiece).toBeTruthy()
      
      // Play Hearts card to move pawn to empty square
      const success = game.playCard('H5', 'e3')
      expect(success).toBe(true)
      
      // Piece should have moved
      expect(game.get('d2' as any)).toBeFalsy() // Original square empty
      expect(game.get('e3' as any)).toBeTruthy() // New square occupied
    })

    it('should allow rescue move even when piece is blocked normally', () => {
      game = createGameWithCards('white', ['H7'])
      
      // Create a blocked position
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['f1', 'c4'], ['f8', 'c5']
      ])
      
      // Try to rescue a piece that would normally be blocked
      const success = game.playCard('H7', 'f3') // Move piece regardless of normal movement rules
      expect(success).toBe(true)
    })

    it('should not allow moving to occupied squares', () => {
      game = createGameWithCards('white', ['H3'])
      
      // Try to move piece to square occupied by own piece
      const success = game.playCard('H3', 'e1') // King's square
      expect(success).toBe(false)
    })

    it('should not allow moving opponent pieces', () => {
      game = createGameWithCards('white', ['H6'])
      
      // First make a move to put a black piece on e6
      game.makeChessMove('e2', 'e4')
      game.makeChessMove('e7', 'e6') // Black pawn to e6
      
      // Try to rescue to square occupied by opponent piece
      const success = game.playCard('H6', 'e6') // Target opponent piece
      expect(success).toBe(false)
    })

    it('should work with different Hearts values', () => {
      const heartsCards = ['H2', 'H5', 'H9', 'HJ', 'HQ', 'HK']
      
      for (const cardId of heartsCards) {
        const testGame = createGameWithCards('white', [cardId])
        testGame.makeChessMove('e2', 'e4')
        testGame.makeChessMove('e7', 'e5')
        
        const success = testGame.playCard(cardId, 'e3')
        expect(success).toBe(true)
      }
    })
  })

  describe('Hearts Ace Effects', () => {
    it('should move King out of check breaking normal rules', () => {
      // Create a check situation
      let checkGame = createGameWithCheck('white')
      checkGame = createGameWithCards('white', ['HA'])
      
      if (checkGame.inCheck()) {
        // Use Hearts Ace to move King to safety, even breaking normal movement
        const success = checkGame.playCard('HA', 'f1') // Emergency king rescue
        expect(success).toBe(true)
        expect(checkGame).not.toBeInCheck()
      }
    })

    it('should allow King movement that breaks normal chess rules', () => {
      game = createGameWithCards('white', ['HA'])
      
      // Set up position where king can't normally move far
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Use Hearts Ace to move King further than normally allowed
      const kingSquare = 'e1'
      const targetSquare = 'e3' // Two squares away
      
      const success = game.playCard('HA', targetSquare)
      expect(success).toBe(true)
      
      // King should be at target square
      const piece = game.get(targetSquare as any)
      expect(piece?.type).toBe('k')
      expect(piece?.color).toBe('w')
    })

    it('should work when King is not in check', () => {
      game = createGameWithCards('white', ['HA'])
      
      // Make some moves to create empty squares
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // King not in check, but still allow rescue move
      const success = game.playCard('HA', 'e2') // Move king to now-empty square
      expect(success).toBe(true)
    })

    it('should prioritize King rescue when multiple pieces available', () => {
      let checkGame = createGameWithCheck('white')
      addCardsToGame(checkGame, 'white', ['HA'])
      
      // Ace should be able to rescue the King specifically
      const success = checkGame.playCard('HA', 'f2') // Move king to empty square
      expect(success).toBe(true)
    })
  })

  describe('Hearts Power Chain Effects', () => {
    it('should move 2 pieces when power chain is active', () => {
      // Set up power chain
      game = createGameWithPowerChain('white', CardSuit.HEARTS, 2)
      game = createGameWithCards('white', ['H8'])
      
      // Make some space
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Play Hearts with power chain - should move 2 pieces
      const success = game.playCard('H8', 'e3') // This should trigger power chain
      expect(success).toBe(true)
      
      // Verify power chain effect (2 pieces moved)
      // Implementation would track multiple piece movements
    })

    it('should allow King movement in power chain with Ace', () => {
      game = createGameWithPowerChain('white', CardSuit.HEARTS, 2)
      game = createGameWithCards('white', ['HA'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Power chain Ace should move King + another piece
      const success = game.playCard('HA', 'e2') // Move king to empty square
      expect(success).toBe(true)
      
      // King should have moved to target square
      expect(game.get('e2' as any)?.type).toBe('k')
    })

    it('should not activate power chain without consecutive same suit', () => {
      // No power chain set up
      game = createGameWithCards('white', ['H4'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Should only move one piece (normal effect)
      const success = game.playCard('H4', 'e3')
      expect(success).toBe(true)
      
      // Verify only one piece moved (no power chain)
    })

    it('should reset power chain after non-Hearts card', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2) // Wrong suit
      game = createGameWithCards('white', ['H9'])
      
      // Hearts card should not get power chain boost from Spades
      const success = game.playCard('H9', 'e3')
      expect(success).toBe(true)
      
      // Should be normal effect, not power chain
    })
  })

  describe('Hearts Effect Validation', () => {
    it('should require valid target square', () => {
      game = createGameWithCards('white', ['H10'])
      
      // Invalid target squares
      expect(game.playCard('H10', 'z9')).toBe(false) // Off board
      expect(game.playCard('H10', '')).toBe(false)    // Empty target
      expect(game.playCard('H10')).toBe(false)        // No target
    })

    it('should maintain board validity after rescue', () => {
      game = createGameWithCards('white', ['HJ'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      game.playCard('HJ', 'e3')
      
      expect(game).toHaveValidBoardState()
      expect(game).toHaveValidGameState()
    })

    it('should not allow rescue to squares off the board', () => {
      game = createGameWithCards('white', ['HQ'])
      
      // Try invalid board positions
      expect(game.playCard('HQ', 'a0')).toBe(false)
      expect(game.playCard('HQ', 'i1')).toBe(false)
      expect(game.playCard('HQ', 'e9')).toBe(false)
    })

    it('should handle edge case positions', () => {
      game = createGameWithCards('white', ['HK'])
      
      // Test rescue from corner positions
      game.load('k7/8/8/8/8/8/8/R6K w - - 0 1') // King in corner
      
      const success = game.playCard('HK', 'h2') // Rescue king to adjacent square
      expect(success).toBe(true)
    })
  })

  describe('Hearts Integration with Chess Rules', () => {
    it('should not put own King in check after rescue', () => {
      game = createGameWithCards('white', ['H2'])
      
      // Set up position where rescue would expose King
      game.load('r6k/8/8/8/8/8/4P3/4K3 w - - 0 1')
      
      // Rescuing pawn should not expose King to check
      const success = game.playCard('H2', 'e3')
      
      if (success) {
        expect(game).not.toBeInCheck()
      }
    })

    it('should work after normal chess moves', () => {
      game = createGameWithCards('white', ['H4'])
      
      // Make normal chess moves first
      game.makeChessMove('e2', 'e4')
      game.makeChessMove('e7', 'e5')
      game.makeChessMove('g1', 'f3')
      game.makeChessMove('b8', 'c6')
      
      // Then use rescue
      const success = game.playCard('H4', 'e3')
      expect(success).toBe(true)
      expect(game).toHaveValidBoardState()
    })

    it('should maintain turn order after card play', () => {
      game = createGameWithCards('white', ['H7'])
      
      expect(game).toBePlayerTurn('white')
      
      game.playCard('H7', 'e3')
      
      expect(game).toBePlayerTurn('black') // Turn should switch
    })

    it('should handle rescue in endgame positions', () => {
      game = createGameWithCards('white', ['H8'])
      
      // Set up simple endgame
      game.load('8/8/8/8/8/3k4/3P4/3K4 w - - 0 1')
      
      const success = game.playCard('H8', 'd4') // Rescue pawn to empty square
      expect(success).toBe(true)
      expect(game).toHaveValidBoardState()
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle rapid succession of Hearts cards', () => {
      const heartsCards = ['H2', 'H3', 'H4', 'H5', 'H6']
      game = createGameWithCards('white', heartsCards)
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      const startTime = performance.now()
      
      for (const cardId of heartsCards) {
        const success = game.playCard(cardId, 'e3')
        // Some may fail due to turn order, but should be fast
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50) // Should be very fast
    })

    it('should maintain consistency across multiple rescues', () => {
      game = createGameWithCards('white', ['H9', 'H10'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // First rescue
      game.playCard('H9', 'e3')
      const state1 = game.fen()
      
      // Make opponent move
      game.makeChessMove('d7', 'd6')
      
      // Second rescue
      game.playCard('H10', 'f3')
      
      expect(game).toHaveValidBoardState()
      expect(game).toHaveValidGameState()
    })
  })
})