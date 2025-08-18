// Royal Gambit Game Types

export enum CardSuit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds', 
  CLUBS = 'clubs',
  SPADES = 'spades'
}

export enum CardValue {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4', 
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K'
}

export interface Card {
  suit: CardSuit
  value: CardValue
  id: string // Unique identifier like "H5", "SA", "DQ"
}

export interface GameState {
  currentPlayer: 'white' | 'black'
  hands: {
    white: Card[]
    black: Card[]
  }
  courtCards: {
    white: Card[]
    black: Card[]
  }
  powerChains: {
    white: { suit: CardSuit | null; count: number }
    black: { suit: CardSuit | null; count: number }
  }
  moveHistory: GameEvent[]
  lastCardPlayed: { player: 'white' | 'black'; card: Card } | null
}

export interface ChessMove {
  from: string
  to: string
  promotion?: string
}

export interface CardPlay {
  card: Card
  effect: CardEffect
  target?: string // Square or piece target
}

export interface CardEffect {
  type: 'rescue' | 'upgrade' | 'swap' | 'strike'
  isAce: boolean
  isPowerChain: boolean
}

export type GameEvent = {
  type: 'move'
  data: ChessMove
  player: 'white' | 'black'
  timestamp: number
} | {
  type: 'card'
  data: CardPlay
  player: 'white' | 'black'
  timestamp: number
}