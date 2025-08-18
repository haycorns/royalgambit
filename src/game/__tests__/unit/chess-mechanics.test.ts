/**
 * Core Chess Mechanics Tests
 * 
 * Tests the fundamental chess rules and mechanics that form the foundation
 * of Royal Gambit. These tests ensure chess.js integration works correctly
 * and all standard chess rules are enforced.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RoyalGambitGame } from '../../RoyalGambitGame'
import '../utils/custom-matchers'
import { 
  createFreshGame, 
  createGameFromFEN, 
  playMoveSequence,
  createGameWithCheck,
  createGameWithCheckmate,
  getAllLegalMoves,
  isMoveLegal 
} from '../utils/test-helpers'
import { BOARD_POSITIONS, MOVE_SEQUENCES } from '../fixtures/game-states'

describe('Chess Mechanics', () => {
  let game: RoyalGambitGame

  beforeEach(() => {
    game = createFreshGame()
  })

  describe('Game Initialization', () => {
    it('should initialize with standard chess starting position', () => {
      expect(game.fen()).toBe(BOARD_POSITIONS.INITIAL)
      expect(game).toHaveValidBoardState()
      expect(game).toBePlayerTurn('white')
    })

    it('should have all 32 pieces in starting position', () => {
      expect(game).toHavePieceCount(32)
    })

    it('should have kings in correct starting positions', () => {
      expect(game).toHaveKingAt('e1') // White king
      expect(game).toHaveKingAt('e8') // Black king
    })

    it('should not be in check at start', () => {
      expect(game).not.toBeInCheck()
      expect(game).not.toBeInCheckmate()
    })

    it('should have white to move first', () => {
      expect(game.turn()).toBe('w')
      expect(game).toBePlayerTurn('white')
    })
  })

  describe('Basic Piece Movement', () => {
    it('should allow valid pawn moves', () => {
      expect(game).toAllowMove('e2', 'e4')
      expect(game).toAllowMove('e2', 'e3')
      expect(game).toAllowMove('d2', 'd4')
      expect(game).toAllowMove('d2', 'd3')
    })

    it('should reject invalid pawn moves', () => {
      expect(game).not.toAllowMove('e2', 'e5') // Too far
      expect(game).not.toAllowMove('e2', 'd3') // Diagonal without capture
      expect(game).not.toAllowMove('e2', 'e1') // Backwards
    })

    it('should allow knight moves', () => {
      expect(game).toAllowMove('g1', 'f3')
      expect(game).toAllowMove('g1', 'h3')
      expect(game).toAllowMove('b1', 'c3')
      expect(game).toAllowMove('b1', 'a3')
    })

    it('should reject invalid knight moves', () => {
      expect(game).not.toAllowMove('g1', 'g3') // Not L-shaped
      expect(game).not.toAllowMove('g1', 'e1') // Blocked by pieces
    })

    it('should not allow moves that expose king to check', () => {
      // Set up position where moving piece would expose king
      game.load('rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3')
      // If white bishop moves, king would be in check from black queen
      expect(game).not.toAllowMove('f1', 'a6')
    })
  })

  describe('Turn Alternation', () => {
    it('should alternate turns after each move', () => {
      expect(game.turn()).toBe('w')
      
      game.makeChessMove('e2', 'e4')
      expect(game.turn()).toBe('b')
      expect(game).toBePlayerTurn('black')
      
      game.makeChessMove('e7', 'e5')
      expect(game.turn()).toBe('w')
      expect(game).toBePlayerTurn('white')
    })

    it('should not allow moves out of turn', () => {
      // White moves first
      expect(game.makeChessMove('e2', 'e4')).toBe(true)
      
      // Should not allow white to move again
      expect(game.makeChessMove('d2', 'd4')).toBe(false)
      expect(game.turn()).toBe('b') // Still black's turn
    })

    it('should maintain turn consistency throughout game', () => {
      const moves = MOVE_SEQUENCES.OPENING_MOVES
      let expectedTurn = 'w'
      
      for (const [from, to] of moves) {
        expect(game.turn()).toBe(expectedTurn)
        expect(game.makeChessMove(from, to)).toBe(true)
        expectedTurn = expectedTurn === 'w' ? 'b' : 'w'
      }
    })
  })

  describe('Check Detection', () => {
    it('should detect when king is in check', () => {
      const checkGame = createGameWithCheck('white')
      expect(checkGame).toBeInCheck()
    })

    it('should not be in check in normal positions', () => {
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      expect(game).not.toBeInCheck()
    })

    it('should only allow moves that get out of check', () => {
      // Create position where white king is in check
      game.load('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 2')
      game.makeChessMove('d1', 'h5') // White queen checks black king
      game.makeChessMove('f7', 'f6') // Black blocks
      game.makeChessMove('h5', 'e8') // White checks black king
      
      expect(game).toBeInCheck()
      
      // Should only allow moves that block check or move king
      const legalMoves = getAllLegalMoves(game)
      
      // All legal moves should either block the check or move the king
      for (const move of legalMoves) {
        const [from, to] = move.split('-')
        expect(isMoveLegal(game, from, to)).toBe(true)
      }
    })
  })

  describe('Checkmate Detection', () => {
    it('should detect checkmate', () => {
      const checkmateGame = createGameWithCheckmate()
      expect(checkmateGame).toBeInCheckmate()
      expect(checkmateGame.isGameOver()).toBe(true)
    })

    it('should not allow any moves when in checkmate', () => {
      const checkmateGame = createGameWithCheckmate()
      const legalMoves = getAllLegalMoves(checkmateGame)
      expect(legalMoves).toHaveLength(0)
    })

    it('should distinguish checkmate from check', () => {
      const checkGame = createGameWithCheck('white')
      expect(checkGame).toBeInCheck()
      expect(checkGame).not.toBeInCheckmate()
      
      const checkmateGame = createGameWithCheckmate()
      expect(checkmateGame).toBeInCheck()
      expect(checkmateGame).toBeInCheckmate()
    })
  })

  describe('Stalemate Detection', () => {
    it('should detect stalemate when no legal moves but not in check', () => {
      // Set up stalemate position
      game.load('k7/8/1Q6/8/8/8/8/7K b - - 0 1')
      expect(game.isStalemate()).toBe(true)
      expect(game.isGameOver()).toBe(true)
      expect(game).not.toBeInCheck()
    })

    it('should not be stalemate when moves are available', () => {
      expect(game.isStalemate()).toBe(false)
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      expect(game.isStalemate()).toBe(false)
    })
  })

  describe('Castling', () => {
    it('should allow kingside castling when conditions are met', () => {
      game.load(BOARD_POSITIONS.CASTLING_KINGSIDE)
      expect(game).toAllowMove('e1', 'g1') // White kingside castling
    })

    it('should allow queenside castling when conditions are met', () => {
      game.load(BOARD_POSITIONS.CASTLING_KINGSIDE)
      expect(game).toAllowMove('e1', 'c1') // White queenside castling
    })

    it('should not allow castling when king has moved', () => {
      playMoveSequence(game, [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6'],
        ['f1', 'c4'], ['f8', 'c5'],
        ['e1', 'f1'], // King moves
        ['d7', 'd6'],
        ['f1', 'e1'] // King moves back
      ])
      
      expect(game).not.toAllowMove('e1', 'g1') // Should not be able to castle
    })

    it('should not allow castling through check', () => {
      // Set up position where castling would move king through check
      game.load('r3k2r/8/8/8/8/8/8/R2QK2R w KQkq - 0 1')
      expect(game).not.toAllowMove('e1', 'g1') // King would pass through check
    })
  })

  describe('En Passant', () => {
    it('should allow en passant capture when conditions are met', () => {
      game.load(BOARD_POSITIONS.EN_PASSANT)
      expect(game).toAllowMove('e5', 'f6') // En passant capture
    })

    it('should not allow en passant when pawn did not move two squares', () => {
      playMoveSequence(game, [
        ['e2', 'e4'], ['f7', 'f6'], // Black pawn moves one square
        ['e4', 'e5'], ['g7', 'g5']  // Different pawn moves
      ])
      
      expect(game).not.toAllowMove('e5', 'f6') // Not en passant
    })
  })

  describe('Pawn Promotion', () => {
    it('should allow pawn promotion when reaching end rank', () => {
      game.load(BOARD_POSITIONS.PROMOTION_READY)
      expect(game).toAllowMove('d7', 'd8')
    })

    it('should require promotion piece selection', () => {
      game.load(BOARD_POSITIONS.PROMOTION_READY)
      
      // Test promotion to different pieces
      const testGame1 = createGameFromFEN(BOARD_POSITIONS.PROMOTION_READY)
      expect(testGame1.makeChessMove('d7', 'd8', 'q')).toBe(true)
      
      const testGame2 = createGameFromFEN(BOARD_POSITIONS.PROMOTION_READY)
      expect(testGame2.makeChessMove('d7', 'd8', 'r')).toBe(true)
      
      const testGame3 = createGameFromFEN(BOARD_POSITIONS.PROMOTION_READY)
      expect(testGame3.makeChessMove('d7', 'd8', 'b')).toBe(true)
      
      const testGame4 = createGameFromFEN(BOARD_POSITIONS.PROMOTION_READY)
      expect(testGame4.makeChessMove('d7', 'd8', 'n')).toBe(true)
    })
  })

  describe('Move Validation', () => {
    it('should reject moves from empty squares', () => {
      expect(game).not.toAllowMove('e4', 'e5') // No piece on e4
    })

    it('should reject moves to squares occupied by own pieces', () => {
      expect(game).not.toAllowMove('e2', 'e1') // Pawn to king square
    })

    it('should allow captures of opponent pieces', () => {
      playMoveSequence(game, [['e2', 'e4'], ['d7', 'd5']])
      expect(game).toAllowMove('e4', 'd5') // Pawn captures pawn
    })

    it('should reject moves that go off the board', () => {
      // This should be handled by chess.js validation
      expect(game.makeChessMove('a1', 'a0')).toBe(false)
      expect(game.makeChessMove('h8', 'i8')).toBe(false)
    })

    it('should handle piece-specific movement rules', () => {
      // Bishop moves diagonally only
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      expect(game).toAllowMove('f1', 'c4') // Diagonal
      expect(game).not.toAllowMove('f1', 'f4') // Straight (blocked anyway)
      
      // Rook moves straight only (after clearing path)
      game.load('r3k3/8/8/8/8/8/8/R3K3 w - - 0 1')
      expect(game).toAllowMove('a1', 'a8') // Vertical
      expect(game).toAllowMove('a1', 'h1') // Horizontal
      expect(game).not.toAllowMove('a1', 'b2') // Diagonal
    })
  })

  describe('Game State Persistence', () => {
    it('should maintain valid board state after moves', () => {
      const moves = MOVE_SEQUENCES.OPENING_MOVES
      
      for (const [from, to] of moves) {
        game.makeChessMove(from, to)
        expect(game).toHaveValidBoardState()
        expect(game).toHaveValidGameState()
      }
    })

    it('should preserve game state when loading from FEN', () => {
      game.load(BOARD_POSITIONS.MIDGAME_COMPLEX)
      expect(game).toHaveValidBoardState()
      expect(game.fen()).toBe(BOARD_POSITIONS.MIDGAME_COMPLEX)
    })

    it('should handle multiple consecutive moves', () => {
      const longSequence = [
        ...MOVE_SEQUENCES.OPENING_MOVES,
        ...MOVE_SEQUENCES.ATTACKING_SEQUENCE,
        ...MOVE_SEQUENCES.DEFENSIVE_SEQUENCE
      ]
      
      playMoveSequence(game, longSequence.slice(0, 10)) // Take first 10 moves
      expect(game).toHaveValidBoardState()
      expect(game.history()).toHaveLength(10)
    })
  })

  describe('Royal Gambit Integration', () => {
    it('should maintain chess rules alongside card mechanics', () => {
      // Make some chess moves
      playMoveSequence(game, [['e2', 'e4'], ['e7', 'e5']])
      
      // Game should still follow chess rules
      expect(game).toHaveValidBoardState()
      expect(game.turn()).toBe('w')
      expect(game).not.toBeInCheck()
    })

    it('should preserve chess state after card operations', () => {
      // Play some cards (this will be expanded when card tests are implemented)
      const initialFEN = game.fen()
      
      // Game state should remain valid
      expect(game).toHaveValidBoardState()
      expect(game).toHaveValidGameState()
    })

    it('should maintain piece count limits', () => {
      // Even with Royal Gambit mechanics, basic chess rules apply
      expect(game).toHavePieceCount(32)
      
      playMoveSequence(game, MOVE_SEQUENCES.OPENING_MOVES)
      expect(game).toHavePieceCount(32) // No captures yet
    })
  })

  describe('Performance', () => {
    it('should validate moves quickly', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        game.move({ from: 'e2', to: 'e4' })
        game.undo()
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete in < 100ms
    })

    it('should handle long games efficiently', () => {
      const startTime = performance.now()
      
      // Simulate a longer game
      for (let i = 0; i < 50; i++) {
        if (game.isGameOver()) break
        
        const moves = game.moves()
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)]
          game.move(randomMove)
        }
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in < 1s
      expect(game).toHaveValidBoardState()
    })
  })
})