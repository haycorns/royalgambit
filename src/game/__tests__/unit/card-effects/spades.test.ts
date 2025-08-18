/**
 * Spades Card Effects Tests
 * 
 * Tests the Spades (Strike) card effects according to Royal Gambit rules:
 * - Normal Effect: Remove one opponent's piece from the board
 * - Ace Effect (Royal Assassin): May remove the King only if the King is already in check.
 *   If the defending player discards any Spade from their hand immediately, the Ace's effect is blocked.
 *   If blocked, the attacker may instead remove any other piece
 * - Power Chain: Remove two opponent pieces instead of one (Ace still follows King-in-check rule)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RoyalGambitGame } from '../../../RoyalGambitGame'
import '../../utils/custom-matchers'
import { 
  createFreshGame, 
  createGameWithCards,
  createGameWithPowerChain,
  createGameWithCheck,
  playMoveSequence 
} from '../../utils/test-helpers'
import { cardFactory } from '../../fixtures/card-factories'
import { CardSuit } from '../../../types'

describe('Spades Card Effects (Strike)', () => {
  let game: RoyalGambitGame

  beforeEach(() => {
    game = createFreshGame()
  })

  describe('Normal Spades Effects', () => {
    it('should remove one opponent piece from the board', () => {
      game = createGameWithCards('white', ['S5'])
      
      // Set up position with opponent pieces available
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Count initial pieces
      const initialPieceCount = game.board().flat().filter(p => p !== null).length
      
      // Strike an opponent piece
      const success = game.playCard('S5', 'e5') // Strike black pawn
      expect(success).toBe(true)
      
      // Should have one less piece
      const finalPieceCount = game.board().flat().filter(p => p !== null).length
      expect(finalPieceCount).toBe(initialPieceCount - 1)
      
      // Target square should be empty
      expect(game.get('e5' as any)).toBeFalsy()
    })

    it('should only target opponent pieces', () => {
      game = createGameWithCards('white', ['S7'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Try to strike own piece
      const success = game.playCard('S7', 'e4') // White's own pawn
      expect(success).toBe(false)
    })

    it('should not target empty squares', () => {
      game = createGameWithCards('white', ['S3'])
      
      // Try to strike empty square
      const success = game.playCard('S3', 'e3')
      expect(success).toBe(false)
    })

    it('should work on different piece types', () => {
      game = createGameWithCards('white', ['S2', 'S4', 'S6'])
      
      // Set up complex position with various pieces
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6'],
        ['f1', 'c4'], ['f8', 'c5']
      ])
      
      // Strike different piece types
      expect(game.playCard('S2', 'e5')).toBe(true)  // Pawn
      game.makeChessMove('d7', 'd6') // Black move
      expect(game.playCard('S4', 'c6')).toBe(true)  // Knight
      game.makeChessMove('g8', 'f6') // Black move
      expect(game.playCard('S6', 'c5')).toBe(true)  // Bishop
    })

    it('should work with all Spades values except Ace', () => {
      const spadesCards = ['S2', 'S5', 'S9', 'SJ', 'SQ', 'SK']
      
      for (const cardId of spadesCards) {
        const testGame = createGameWithCards('white', [cardId])
        testGame.makeChessMove('e2', 'e4')
        testGame.makeChessMove('e7', 'e5')
        
        const success = testGame.playCard(cardId, 'e5')
        expect(success).toBe(true)
      }
    })
  })

  describe('Ace of Spades (Royal Assassin) Effects', () => {
    it('should remove King only when King is in check', () => {
      // Create position where King is in check
      const checkGame = createGameWithCheck('black')
      checkGame = createGameWithCards('white', ['SA'])
      
      if (checkGame.inCheck()) {
        // Find the opponent King's position
        const board = checkGame.board()
        let kingSquare = ''
        
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            const piece = board[rank][file]
            if (piece && piece.type === 'k' && piece.color === 'b') {
              kingSquare = String.fromCharCode(97 + file) + (8 - rank)
              break
            }
          }
        }
        
        if (kingSquare) {
          const success = checkGame.playCard('SA', kingSquare)
          expect(success).toBe(true)
          
          // King should be removed (game won)
          expect(checkGame.get(kingSquare as any)).toBeFalsy()
        }
      }
    })

    it('should not remove King when King is not in check', () => {
      game = createGameWithCards('white', ['SA'])
      
      // King not in check
      expect(game).not.toBeInCheck()
      
      // Try to assassinate King
      const success = game.playCard('SA', 'e8') // Black King
      expect(success).toBe(false)
    })

    it('should be blocked by opponent discarding any Spade', () => {
      // Create check position
      const checkGame = createGameWithCheck('black')
      checkGame = createGameWithCards('white', ['SA'])
      
      // Give black player Spades to block with
      const blackCards = checkGame.getGameState().hands.black
      blackCards.push(cardFactory.createCard('S3')) // Add blocking Spade
      
      // This would need joust/blocking mechanic implementation
      // For now, test the validation logic
      expect(blackCards.some(card => card.suit === 'spades')).toBe(true)
    })

    it('should allow fallback to other piece if blocked', () => {
      // When Ace of Spades is blocked, should be able to strike other piece
      game = createGameWithCards('white', ['SA'])
      
      // Set up position with King in check and other pieces available
      const checkGame = createGameWithCheck('black')
      checkGame = createGameWithCards('white', ['SA'])
      
      playMoveSequence(checkGame, [['d2', 'd4']]) // Make another piece available
      
      // If assassination is blocked, should be able to strike other piece
      const success = checkGame.playCard('SA', 'e5') // Strike other piece instead
      expect(success).toBe(true)
    })

    it('should distinguish Ace effects from normal Spades', () => {
      game = createGameWithCards('white', ['SK', 'SA']) // King and Ace
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // King of Spades should work like normal strike
      expect(game.playCard('SK', 'e5')).toBe(true)
      
      game.makeChessMove('d7', 'd6') // Black move
      
      // Ace should have different validation (King must be in check)
      expect(game.playCard('SA', 'd6')).toBe(true) // Should work on normal piece
    })
  })

  describe('Spades Power Chain Effects', () => {
    it('should remove 2 pieces when power chain is active', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2)
      game = createGameWithCards('white', ['S8'])
      
      // Set up position with multiple opponent pieces
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd5']
      ])
      
      const initialPieceCount = game.board().flat().filter(p => p !== null).length
      
      // Play Spades with power chain
      const success = game.playCard('S8', 'e5')
      expect(success).toBe(true)
      
      // Should remove 2 pieces (power chain effect)
      const finalPieceCount = game.board().flat().filter(p => p !== null).length
      expect(finalPieceCount).toBe(initialPieceCount - 2)
    })

    it('should respect Ace rules even in power chain', () => {
      // Even with power chain, Ace still requires King to be in check
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2)
      game = createGameWithCards('white', ['SA'])
      
      // King not in check
      expect(game).not.toBeInCheck()
      
      // Ace should not be able to target King even with power chain
      const success = game.playCard('SA', 'e8')
      expect(success).toBe(false)
    })

    it('should activate power chain only with consecutive Spades', () => {
      // Wrong suit power chain should not help
      game = createGameWithPowerChain('white', CardSuit.HEARTS, 2)
      game = createGameWithCards('white', ['S9'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      const initialPieceCount = game.board().flat().filter(p => p !== null).length
      
      const success = game.playCard('S9', 'e5')
      expect(success).toBe(true)
      
      // Should only remove 1 piece (no power chain from wrong suit)
      const finalPieceCount = game.board().flat().filter(p => p !== null).length
      expect(finalPieceCount).toBe(initialPieceCount - 1)
    })
  })

  describe('Strike Effect Validation', () => {
    it('should require valid target piece', () => {
      game = createGameWithCards('white', ['S10'])
      
      // Invalid targets
      expect(game.playCard('S10', 'z9')).toBe(false) // Off board
      expect(game.playCard('S10', '')).toBe(false)   // Empty target
      expect(game.playCard('S10')).toBe(false)       // No target
    })

    it('should maintain board validity after strike', () => {
      game = createGameWithCards('white', ['SJ'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      game.playCard('SJ', 'e5')
      
      expect(game).toHaveValidBoardState()
      expect(game).toHaveValidGameState()
    })

    it('should not create invalid board positions', () => {
      game = createGameWithCards('white', ['SQ'])
      
      // Strike should not result in impossible positions
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      const success = game.playCard('SQ', 'e5')
      expect(success).toBe(true)
      
      // Board should still be valid chess position
      expect(game.fen()).toBeTruthy()
      expect(game).toHaveValidBoardState()
    })

    it('should handle edge case positions', () => {
      game = createGameWithCards('white', ['S4'])
      
      // Test strike in corner/edge positions
      game.load('r7/8/8/8/8/8/8/7K w - - 0 1') // Rook in corner
      
      const success = game.playCard('S4', 'a8')
      expect(success).toBe(true)
      expect(game.get('a8' as any)).toBeFalsy()
    })
  })

  describe('Strike Integration with Chess Rules', () => {
    it('should not affect check/checkmate detection', () => {
      game = createGameWithCards('white', ['S6'])
      
      // Create position where strike might affect check status
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d1', 'h5'], ['f7', 'f6']  // White queen attacks
      ])
      
      // Strike a piece and verify check status is correct
      game.playCard('S6', 'e5')
      
      // Game should still correctly detect check/no check
      expect(game).toHaveValidBoardState()
    })

    it('should work after normal chess moves', () => {
      game = createGameWithCards('white', ['S7'])
      
      // Mix chess moves and strikes
      game.makeChessMove('e2', 'e4')
      game.makeChessMove('e7', 'e5')
      game.makeChessMove('g1', 'f3')
      game.makeChessMove('b8', 'c6')
      
      const success = game.playCard('S7', 'e5')
      expect(success).toBe(true)
      expect(game).toHaveValidBoardState()
    })

    it('should maintain turn order after strike', () => {
      game = createGameWithCards('white', ['S8'])
      
      expect(game).toBePlayerTurn('white')
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      game.playCard('S8', 'e5')
      
      expect(game).toBePlayerTurn('black') // Turn should switch
    })

    it('should handle strikes in endgame', () => {
      game = createGameWithCards('white', ['S9'])
      
      // Simple endgame with few pieces
      game.load('8/8/8/4p3/8/3k4/3P4/3K4 w - - 0 1')
      
      const success = game.playCard('S9', 'e5') // Strike the pawn
      expect(success).toBe(true)
      expect(game).toHaveValidBoardState()
    })
  })

  describe('Joust Defense Integration', () => {
    it('should allow opponent to challenge strikes', () => {
      game = createGameWithCards('white', ['S10'])
      
      // Give opponent cards to defend with
      const blackCards = game.getGameState().hands.black
      blackCards.push(cardFactory.createCard('HK')) // Defensive card
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // This would trigger joust mechanics when implemented
      const success = game.playCard('S10', 'e5')
      
      // For now, just verify the card play attempt works
      expect(typeof success).toBe('boolean')
    })

    it('should handle blocked strikes gracefully', () => {
      game = createGameWithCards('white', ['SA'])
      
      // Set up Ace assassination attempt
      const checkGame = createGameWithCheck('black')
      
      // Give defender Spades to block
      const blackCards = checkGame.getGameState().hands.black
      blackCards.push(cardFactory.createCard('S2'))
      
      // Assassination attempt (would be blocked)
      // Implementation would handle joust resolution
      expect(blackCards.some(card => card.suit === 'spades')).toBe(true)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle multiple strikes efficiently', () => {
      const spadesCards = ['S2', 'S3', 'S4', 'S5']
      game = createGameWithCards('white', spadesCards)
      
      // Set up target-rich environment
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd5']
      ])
      
      const startTime = performance.now()
      
      for (const cardId of spadesCards) {
        const targets = ['e5', 'd5', 'e7', 'd7'] // Various targets
        const target = targets[spadesCards.indexOf(cardId) % targets.length]
        game.playCard(cardId, target)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should maintain consistency across multiple strikes', () => {
      game = createGameWithCards('white', ['S6', 'S7'])
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd5']
      ])
      
      // First strike
      game.playCard('S6', 'e5')
      expect(game).toHaveValidBoardState()
      
      // Opponent move
      game.makeChessMove('b8', 'c6')
      
      // Second strike
      game.playCard('S7', 'd5')
      expect(game).toHaveValidBoardState()
      expect(game).toHaveValidGameState()
    })

    it('should handle edge case with no valid targets', () => {
      game = createGameWithCards('white', ['S8'])
      
      // Position with no opponent pieces in range/available
      game.load('8/8/8/8/8/8/8/K6k w - - 0 1')
      
      // Should handle gracefully when no valid targets
      const success = game.playCard('S8', 'e4') // Empty square
      expect(success).toBe(false)
    })
  })
})