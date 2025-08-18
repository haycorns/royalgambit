/**
 * Predefined game states for consistent testing
 * These fixtures represent common game scenarios and edge cases
 */

import type { GameState } from '../../types'
import { CardSuit } from '../../types'

/**
 * Initial game state - fresh game start
 */
export const INITIAL_GAME_STATE: Partial<GameState> = {
  currentPlayer: 'white',
  powerChains: {
    white: { suit: null, count: 0 },
    black: { suit: null, count: 0 }
  },
  moveHistory: [],
  lastCardPlayed: null
}

/**
 * Mid-game state with active power chains
 */
export const POWER_CHAIN_GAME_STATE: Partial<GameState> = {
  currentPlayer: 'white',
  powerChains: {
    white: { suit: CardSuit.HEARTS, count: 2 },
    black: { suit: null, count: 0 }
  },
  lastCardPlayed: {
    player: 'white',
    card: { suit: CardSuit.HEARTS, value: 'K', id: 'HK' }
  }
}

/**
 * Game state with both players having power chains
 */
export const DUAL_POWER_CHAIN_STATE: Partial<GameState> = {
  currentPlayer: 'black',
  powerChains: {
    white: { suit: CardSuit.SPADES, count: 3 },
    black: { suit: CardSuit.DIAMONDS, count: 2 }
  }
}

/**
 * Endgame state with few pieces and cards
 */
export const ENDGAME_STATE: Partial<GameState> = {
  currentPlayer: 'white',
  powerChains: {
    white: { suit: null, count: 0 },
    black: { suit: null, count: 0 }
  }
}

/**
 * Board positions in FEN notation for testing
 */
export const BOARD_POSITIONS = {
  INITIAL: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  
  SICILIAN_DEFENSE: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
  
  FRENCH_DEFENSE: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  
  KINGS_GAMBIT: 'rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2',
  
  FOOLS_MATE: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
  
  SCHOLARS_MATE: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 4 4',
  
  MIDGAME_COMPLEX: 'r1bq1rk1/ppp2ppp/2n1bn2/2bpp3/2B1P3/3P1N2/PPP2PPP/RNBQR1K1 w - - 0 9',
  
  WHITE_IN_CHECK: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 2',
  
  BLACK_IN_CHECK: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 2',
  
  ENDGAME_KING_PAWN: '8/8/8/8/8/3k4/3P4/3K4 w - - 0 1',
  
  PROMOTION_READY: '8/3P4/8/8/8/8/3k4/3K4 w - - 0 1',
  
  CASTLING_KINGSIDE: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  
  EN_PASSANT: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3'
} as const

/**
 * Card combinations for testing different scenarios
 */
export const CARD_COMBINATIONS = {
  ALL_HEARTS: ['H2', 'H3', 'H4', 'H5', 'H6'],
  ALL_SPADES: ['S7', 'S8', 'S9', 'S10', 'SJ'],
  ALL_ACES: ['HA', 'DA', 'CA', 'SA'],
  MIXED_SUITS: ['H5', 'D7', 'C2', 'S9', 'H10'],
  HIGH_CARDS: ['HK', 'DQ', 'CJ', 'SA', 'H10'],
  LOW_CARDS: ['H2', 'D2', 'C2', 'S2', 'H3'],
  POWER_CHAIN_HEARTS: ['H5', 'H8', 'HJ'],
  POWER_CHAIN_SPADES: ['S3', 'S9', 'SK'],
  COURT_CARDS_ROYAL: ['HK', 'DQ', 'CJ'],
  JOUST_SCENARIO: ['SA', 'HK', 'DQ'] // High value cards for joust testing
} as const

/**
 * Move sequences for testing game progression
 */
export const MOVE_SEQUENCES = {
  OPENING_MOVES: [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5']
  ] as Array<[string, string]>,
  
  ATTACKING_SEQUENCE: [
    ['e2', 'e4'], ['e7', 'e5'],
    ['d1', 'h5'], ['b8', 'c6'],
    ['f1', 'c4'], ['g8', 'f6']
  ] as Array<[string, string]>,
  
  DEFENSIVE_SEQUENCE: [
    ['e2', 'e4'], ['e7', 'e6'],
    ['d2', 'd4'], ['d7', 'd5'],
    ['b1', 'c3'], ['g8', 'f6']
  ] as Array<[string, string]>,
  
  CASTLE_PREPARATION: [
    ['e2', 'e4'], ['e7', 'e5'],
    ['g1', 'f3'], ['b8', 'c6'],
    ['f1', 'c4'], ['f8', 'c5'],
    ['d2', 'd3'], ['d7', 'd6']
  ] as Array<[string, string]>
} as const

/**
 * Test scenarios combining board positions with card states
 */
export const TEST_SCENARIOS = {
  // Early game with full hands
  EARLY_GAME: {
    position: BOARD_POSITIONS.INITIAL,
    whiteCards: CARD_COMBINATIONS.MIXED_SUITS,
    blackCards: CARD_COMBINATIONS.HIGH_CARDS,
    courtCards: {
      white: CARD_COMBINATIONS.COURT_CARDS_ROYAL,
      black: ['S10', 'D9', 'C8']
    }
  },
  
  // Mid game with power chain active
  MID_GAME_POWER_CHAIN: {
    position: BOARD_POSITIONS.MIDGAME_COMPLEX,
    whiteCards: CARD_COMBINATIONS.POWER_CHAIN_HEARTS,
    blackCards: CARD_COMBINATIONS.MIXED_SUITS,
    powerChain: {
      white: { suit: CardSuit.HEARTS, count: 2 },
      black: { suit: null, count: 0 }
    }
  },
  
  // Endgame with few cards
  ENDGAME_FEW_CARDS: {
    position: BOARD_POSITIONS.ENDGAME_KING_PAWN,
    whiteCards: ['HA', 'SA'],
    blackCards: ['DK', 'CQ'],
    courtCards: {
      white: ['H5'],
      black: ['S7']
    }
  },
  
  // Check scenario with defensive cards
  CHECK_DEFENSE: {
    position: BOARD_POSITIONS.WHITE_IN_CHECK,
    whiteCards: CARD_COMBINATIONS.ALL_HEARTS, // Hearts can rescue king
    blackCards: CARD_COMBINATIONS.ALL_SPADES,
    courtCards: {
      white: ['HA'], // Ace of Hearts for emergency rescue
      black: ['SA', 'SK', 'SQ']
    }
  },
  
  // Joust scenario
  JOUST_READY: {
    position: BOARD_POSITIONS.MIDGAME_COMPLEX,
    whiteCards: ['SA', 'HK'], // High attack cards
    blackCards: ['SK', 'DQ'], // High defense cards
    courtCards: {
      white: ['S9'],
      black: ['H8']
    }
  }
} as const

/**
 * Edge case scenarios for thorough testing
 */
export const EDGE_CASES = {
  EMPTY_HANDS: {
    whiteCards: [],
    blackCards: [],
    courtCards: { white: [], black: [] }
  },
  
  MAXIMUM_CARDS: {
    whiteCards: ['H2', 'H3', 'H4', 'H5', 'H6'], // 5 in hand
    blackCards: ['S2', 'S3', 'S4', 'S5', 'S6'],
    courtCards: {
      white: ['HA', 'HK', 'HQ'], // 3 in court
      black: ['SA', 'SK', 'SQ']
    }
  },
  
  ALL_ACES: {
    whiteCards: ['HA', 'DA'],
    blackCards: ['CA', 'SA'],
    courtCards: {
      white: ['HK', 'DK', 'CK'],
      black: ['HQ', 'DQ', 'CQ']
    }
  },
  
  POWER_CHAIN_MAXIMUM: {
    powerChain: {
      white: { suit: CardSuit.HEARTS, count: 5 },
      black: { suit: CardSuit.SPADES, count: 3 }
    }
  }
} as const