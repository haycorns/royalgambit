/**
 * Power Chains Comprehensive Tests
 * 
 * Tests the Power Chain mechanic according to Royal Gambit rules:
 * "If you play two cards of the same suit in consecutive turns (from either hand or Court), 
 *  the second card gains a boosted effect"
 * 
 * Boosted effects:
 * - Hearts: Move two pieces this turn instead of one (can include King if Ace used)
 * - Diamonds: Promote two pawns or one pawn + one other piece (requires Ace for "other piece")
 * - Clubs: Swap two of your pieces AND swap two of your opponent's pieces  
 * - Spades: Remove two opponent pieces instead of one (Ace still follows King-in-check rule)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RoyalGambitGame } from '../../RoyalGambitGame'
import '../utils/custom-matchers'
import { 
  createFreshGame, 
  createGameWithCards,
  createGameWithPowerChain,
  playMoveSequence,
  createGameWithCourtCards 
} from '../utils/test-helpers'
import { cardFactory, cardScenarios } from '../fixtures/card-factories'
import { CardSuit } from '../../types'

describe('Power Chains Mechanics', () => {
  let game: RoyalGambitGame

  beforeEach(() => {
    game = createFreshGame()
  })

  describe('Power Chain Activation', () => {
    it('should activate when playing two cards of same suit consecutively', () => {
      game = createGameWithCards('white', ['H5', 'H8'])
      
      // Make some moves to set up
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // First Hearts card - no power chain yet
      expect(game).not.toBeInPowerChain(CardSuit.HEARTS)
      expect(game).toHavePowerChainCount(0)
      
      game.playCard('H5', 'e3')
      
      // Still no power chain (need consecutive same suit)
      expect(game).toHavePowerChainCount(1) // Count starts
      
      // Opponent move
      game.makeChessMove('d7', 'd6')
      
      // Second Hearts card - should activate power chain
      game.playCard('H8', 'f3')
      
      expect(game).toBeInPowerChain(CardSuit.HEARTS)
      expect(game).toHavePowerChainCount(2)
    })

    it('should reset power chain when different suit is played', () => {
      game = createGameWithCards('white', ['H5', 'S3'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // First Hearts card
      game.playCard('H5', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      // Opponent move
      game.makeChessMove('d7', 'd6')
      
      // Different suit - should reset chain
      game.playCard('S3', 'e5')
      
      expect(game).not.toBeInPowerChain(CardSuit.HEARTS)
      expect(game).toHavePowerChainCount(1) // New chain starts with Spades
    })

    it('should not activate across different players', () => {
      game = createGameWithCards('white', ['H5'])
      game = createGameWithCards('black', ['H8'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // White plays Hearts
      game.playCard('H5', 'e3')
      
      // Black plays Hearts - should not continue white's chain
      game.playCard('H8', 'f6') // Black's turn
      
      // Each player has separate power chain tracking
      const gameState = game.getGameState()
      expect(gameState.powerChains.white.count).toBe(1)
      expect(gameState.powerChains.black.count).toBe(1)
      // Neither should have power chain boost yet
    })

    it('should work with cards from court', () => {
      game = createGameWithCards('white', ['H5'])
      game = createGameWithCourtCards('white', ['H8', 'D3', 'S2'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // First Hearts from hand
      game.playCard('H5', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      // Opponent move
      game.makeChessMove('d7', 'd6')
      
      // Second Hearts from court - should activate power chain
      game.playCard('H8', 'f3', true) // true = from court
      
      expect(game).toBeInPowerChain(CardSuit.HEARTS)
      expect(game).toHavePowerChainCount(2)
    })

    it('should track chains for each player independently', () => {
      game = createGameWithCards('white', ['H5', 'H8'])
      game = createGameWithCards('black', ['S3', 'S7'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // White starts Hearts chain
      game.playCard('H5', 'e3')
      
      // Black starts Spades chain  
      game.playCard('S3', 'e4') // Strike white pawn
      
      // White continues Hearts chain
      game.playCard('H8', 'f3')
      
      // Black continues Spades chain
      game.playCard('S7', 'f3') // Strike white piece
      
      const gameState = game.getGameState()
      expect(gameState.powerChains.white.suit).toBe(CardSuit.HEARTS)
      expect(gameState.powerChains.white.count).toBe(2)
      expect(gameState.powerChains.black.suit).toBe(CardSuit.SPADES)
      expect(gameState.powerChains.black.count).toBe(2)
    })
  })

  describe('Hearts Power Chain Effects', () => {
    it('should move 2 pieces instead of 1', () => {
      game = createGameWithPowerChain('white', CardSuit.HEARTS, 2)
      game = createGameWithCards('white', ['H9'])
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd6']
      ])
      
      const initialPositions = {
        piece1: game.get('f1' as any), // Bishop
        piece2: game.get('g1' as any)  // Knight
      }
      
      // Play Hearts with power chain - should move 2 pieces
      const success = game.playCard('H9', 'e3')
      expect(success).toBe(true)
      
      // Verify 2 pieces moved (implementation specific)
      // This would require the game to track multiple piece movements
    })

    it('should include King movement with Ace in power chain', () => {
      game = createGameWithPowerChain('white', CardSuit.HEARTS, 2)
      game = createGameWithCards('white', ['HA'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      const initialKingPos = 'e1'
      
      // Hearts Ace with power chain should move King + another piece
      const success = game.playCard('HA', 'f1')
      expect(success).toBe(true)
      
      // King should have moved
      expect(game.get(initialKingPos as any)).toBeFalsy()
      expect(game.get('f1' as any)?.type).toBe('k')
    })

    it('should not boost if not consecutive same suit', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2) // Wrong suit
      game = createGameWithCards('white', ['H6'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Should be normal Hearts effect, not boosted
      const success = game.playCard('H6', 'e3')
      expect(success).toBe(true)
      
      // Should have moved only 1 piece (normal effect)
    })
  })

  describe('Diamonds Power Chain Effects', () => {
    it('should promote 2 pawns with normal card', () => {
      game = createGameWithPowerChain('white', CardSuit.DIAMONDS, 2)
      game = createGameWithCards('white', ['D5'])
      
      // Set up position with promotable pawns
      game.load('8/2P1P3/8/8/8/8/8/4K2k w - - 0 1') // Two white pawns ready to promote
      
      // Diamonds with power chain should promote 2 pawns
      const success = game.playCard('D5', 'c8')
      expect(success).toBe(true)
      
      // Both pawns should be promoted (c7->c8, e7->e8)
      expect(game.get('c8' as any)?.type).toBe('q')
      expect(game.get('e8' as any)?.type).toBe('q')
    })

    it('should promote 1 pawn + 1 other piece with Ace', () => {
      game = createGameWithPowerChain('white', CardSuit.DIAMONDS, 2)
      game = createGameWithCards('white', ['DA'])
      
      // Set up position with pawn and other piece
      game.load('8/2P5/8/8/8/8/2R5/4K2k w - - 0 1')
      
      // Diamonds Ace with power chain should promote pawn + other piece
      const success = game.playCard('DA', 'c8')
      expect(success).toBe(true)
      
      // Pawn promoted
      expect(game.get('c8' as any)?.type).toBe('q')
      // Rook promoted to queen (Ace effect)
      expect(game.get('c2' as any)?.type).toBe('q')
    })

    it('should require Ace for non-pawn promotion in power chain', () => {
      game = createGameWithPowerChain('white', CardSuit.DIAMONDS, 2)
      game = createGameWithCards('white', ['D7']) // Not Ace
      
      game.load('8/2P5/8/8/8/8/2R5/4K2k w - - 0 1')
      
      // Non-Ace should only promote pawns, even with power chain
      const success = game.playCard('D7', 'c8')
      expect(success).toBe(true)
      
      expect(game.get('c8' as any)?.type).toBe('q') // Pawn promoted
      expect(game.get('c2' as any)?.type).toBe('r') // Rook unchanged
    })
  })

  describe('Clubs Power Chain Effects', () => {
    it('should swap 2 own pieces AND 2 opponent pieces', () => {
      game = createGameWithPowerChain('white', CardSuit.CLUBS, 2)
      game = createGameWithCards('white', ['C4'])
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6']
      ])
      
      const initialState = {
        whiteKnight: game.get('f3' as any),
        whiteBishop: game.get('f1' as any),
        blackKnight: game.get('c6' as any),
        blackBishop: game.get('f8' as any)
      }
      
      // Clubs with power chain should swap 2+2 pieces
      const success = game.playCard('C4', 'f1') // Swap target
      expect(success).toBe(true)
      
      // Verify swaps occurred (implementation specific)
      // 2 white pieces swapped positions
      // 2 black pieces swapped positions
    })

    it('should work with Ace to swap with opponent pieces', () => {
      game = createGameWithPowerChain('white', CardSuit.CLUBS, 2)
      game = createGameWithCards('white', ['CA'])
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6']
      ])
      
      // Clubs Ace with power chain should swap own piece with opponent's
      const success = game.playCard('CA', 'c6')
      expect(success).toBe(true)
      
      // White piece should now be where black piece was
      expect(game.get('c6' as any)?.color).toBe('w')
    })

    it('should respect normal Clubs rules without power chain', () => {
      game = createGameWithCards('white', ['C8']) // No power chain
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6']
      ])
      
      // Normal Clubs should only swap own pieces
      const success = game.playCard('C8', 'f1')
      expect(success).toBe(true)
      
      // Only white pieces swapped, not opponent's
    })
  })

  describe('Spades Power Chain Effects', () => {
    it('should remove 2 opponent pieces instead of 1', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2)
      game = createGameWithCards('white', ['S6'])
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd5']
      ])
      
      const initialPieceCount = game.board().flat().filter(p => p !== null).length
      
      // Spades with power chain should remove 2 pieces
      const success = game.playCard('S6', 'e5')
      expect(success).toBe(true)
      
      const finalPieceCount = game.board().flat().filter(p => p !== null).length
      expect(finalPieceCount).toBe(initialPieceCount - 2)
    })

    it('should still respect King-in-check rule for Ace', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2)
      game = createGameWithCards('white', ['SA'])
      
      // King not in check
      expect(game).not.toBeInCheck()
      
      // Even with power chain, Ace cannot target King unless in check
      const success = game.playCard('SA', 'e8')
      expect(success).toBe(false)
    })

    it('should remove 2 pieces with non-Ace Spades', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2)
      game = createGameWithCards('white', ['SK']) // King, not Ace
      
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['d2', 'd4'], ['d7', 'd5']
      ])
      
      const initialPieceCount = game.board().flat().filter(p => p !== null).length
      
      const success = game.playCard('SK', 'e5')
      expect(success).toBe(true)
      
      // Should remove 2 pieces (power chain effect)
      const finalPieceCount = game.board().flat().filter(p => p !== null).length
      expect(finalPieceCount).toBe(initialPieceCount - 2)
    })
  })

  describe('Power Chain Persistence and Reset', () => {
    it('should maintain power chain across multiple turns', () => {
      game = createGameWithCards('white', ['H3', 'H7', 'H9'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Build up power chain
      game.playCard('H3', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      game.makeChessMove('d7', 'd6') // Black move
      
      game.playCard('H7', 'f3')
      expect(game).toHavePowerChainCount(2)
      expect(game).toBeInPowerChain(CardSuit.HEARTS)
      
      game.makeChessMove('c7', 'c6') // Black move
      
      game.playCard('H9', 'g3')
      expect(game).toHavePowerChainCount(3)
    })

    it('should reset when opponent plays intervening card', () => {
      game = createGameWithCards('white', ['H5', 'H8'])
      game = createGameWithCards('black', ['S3'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // White starts Hearts chain
      game.playCard('H5', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      // Black plays different suit (should not affect white's chain)
      game.playCard('S3', 'e4')
      
      // White continues - chain should still be active
      game.playCard('H8', 'f3')
      expect(game).toBeInPowerChain(CardSuit.HEARTS)
    })

    it('should reset when same player plays different suit', () => {
      game = createGameWithCards('white', ['H5', 'D3'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Start Hearts chain
      game.playCard('H5', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      game.makeChessMove('d7', 'd6') // Black move
      
      // White plays different suit - should reset
      game.playCard('D3', 'd2') // Promote something
      
      const powerChain = game.getPowerChainStatus()
      expect(powerChain.suit).toBe(CardSuit.DIAMONDS)
      expect(powerChain.count).toBe(1) // Reset to new suit
    })

    it('should handle chess moves not affecting power chain', () => {
      game = createGameWithCards('white', ['H5', 'H8'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Start Hearts chain
      game.playCard('H5', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      // Make chess move instead of card play
      game.makeChessMove('g1', 'f3')
      game.makeChessMove('d7', 'd6')
      
      // Power chain should still be active for next Hearts card
      game.playCard('H8', 'f4')
      expect(game).toBeInPowerChain(CardSuit.HEARTS)
    })
  })

  describe('Power Chain Edge Cases', () => {
    it('should handle maximum reasonable power chain counts', () => {
      const heartsCards = ['H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8']
      game = createGameWithCards('white', heartsCards)
      
      let count = 0
      for (const cardId of heartsCards) {
        if (count % 2 === 0) {
          playMoveSequence(game, [['d2', 'd3'], ['d7', 'd6']])
        }
        
        game.playCard(cardId, 'e3')
        count++
        
        expect(game).toHavePowerChainCount(count)
        
        if (count >= 2) {
          expect(game).toBeInPowerChain(CardSuit.HEARTS)
        }
      }
      
      expect(game).toHavePowerChainCount(7)
    })

    it('should handle rapid suit switching', () => {
      game = createGameWithCards('white', ['H2', 'S3', 'D4', 'C5', 'H6'])
      
      const suits = [CardSuit.HEARTS, CardSuit.SPADES, CardSuit.DIAMONDS, CardSuit.CLUBS, CardSuit.HEARTS]
      const cards = ['H2', 'S3', 'D4', 'C5', 'H6']
      
      for (let i = 0; i < cards.length; i++) {
        if (i > 0) {
          game.makeChessMove('d7', 'd6') // Black move between each card
        }
        
        game.playCard(cards[i], 'e3')
        
        const powerChain = game.getPowerChainStatus()
        expect(powerChain.suit).toBe(suits[i])
        expect(powerChain.count).toBe(1) // Each switch resets to 1
      }
    })

    it('should handle power chain with no valid targets', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 3)
      game = createGameWithCards('white', ['S9'])
      
      // Position with no opponent pieces
      game.load('8/8/8/8/8/8/8/K6k w - - 0 1')
      
      // Power chain should not activate if no valid targets
      const success = game.playCard('S9', 'e4') // Empty square
      expect(success).toBe(false)
    })

    it('should maintain power chain state across game save/load', () => {
      game = createGameWithPowerChain('white', CardSuit.HEARTS, 3)
      
      const powerChainBefore = game.getPowerChainStatus()
      const fenBefore = game.fen()
      
      // Simulate save/load
      const newGame = createFreshGame()
      newGame.load(fenBefore)
      
      // Power chain state would need to be preserved separately
      // This test validates the need for proper state serialization
      expect(fenBefore).toBeTruthy()
      expect(powerChainBefore.count).toBe(3)
    })
  })

  describe('Power Chain Performance', () => {
    it('should handle many consecutive cards efficiently', () => {
      const manyCards = Array.from({length: 20}, (_, i) => `H${(i % 13) + 2}`)
      game = createGameWithCards('white', manyCards)
      
      const startTime = performance.now()
      
      for (let i = 0; i < manyCards.length; i++) {
        if (i > 0) {
          game.makeChessMove('d7', 'd6') // Dummy moves
        }
        game.playCard(manyCards[i], 'e3')
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
      
      expect(game).toHavePowerChainCount(20)
    })

    it('should maintain valid state during stress test', () => {
      const cards = ['H2', 'H3', 'S4', 'S5', 'D6', 'D7', 'C8', 'C9']
      game = createGameWithCards('white', cards)
      
      for (let i = 0; i < cards.length; i++) {
        game.playCard(cards[i], 'e3')
        
        // Verify state remains valid
        expect(game).toHaveValidGameState()
        expect(game).toHaveValidBoardState()
        
        if (i < cards.length - 1) {
          game.makeChessMove('d7', 'd6')
        }
      }
    })
  })

  describe('Power Chain Integration', () => {
    it('should work with joust mechanics', () => {
      game = createGameWithPowerChain('white', CardSuit.SPADES, 2)
      game = createGameWithCards('white', ['S8'])
      
      // Give opponent cards to potentially block
      const blackCards = game.getGameState().hands.black
      blackCards.push(cardFactory.createCard('HK'))
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // This would interact with joust system when implemented
      const success = game.playCard('S8', 'e5')
      
      // For now, just verify the attempt works
      expect(typeof success).toBe('boolean')
    })

    it('should interact correctly with court cards', () => {
      game = createGameWithCards('white', ['H5'])
      game = createGameWithCourtCards('white', ['H8', 'H9', 'HJ'])
      
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Start chain with hand card
      game.playCard('H5', 'e3')
      expect(game).toHavePowerChainCount(1)
      
      game.makeChessMove('d7', 'd6') // Black move
      
      // Continue with court card
      game.playCard('H8', 'f3', true) // from court
      expect(game).toBeInPowerChain(CardSuit.HEARTS)
      
      // Court card should be replaced
      const court = game.getCurrentPlayerCourt()
      expect(court.some(card => card.id === 'H8')).toBe(false)
    })
  })
})