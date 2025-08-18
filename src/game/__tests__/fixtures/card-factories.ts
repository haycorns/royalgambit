/**
 * Card factories for generating test cards and scenarios
 * Provides builders for creating specific card combinations and states
 */

import { CardSystem } from '../../CardSystem'
import type { Card, CardSuit } from '../../types'
import { CardSuit as SuitEnum, CardValue } from '../../types'

/**
 * Card factory for generating test cards with specific properties
 */
export class CardFactory {
  private cardSystem: CardSystem

  constructor() {
    this.cardSystem = new CardSystem()
  }

  /**
   * Create a single card by ID
   */
  createCard(cardId: string): Card {
    const card = this.cardSystem.createCard(cardId)
    if (!card) {
      throw new Error(`Failed to create card with ID: ${cardId}`)
    }
    return card
  }

  /**
   * Create multiple cards by IDs
   */
  createCards(cardIds: string[]): Card[] {
    return cardIds.map(id => this.createCard(id))
  }

  /**
   * Create all cards of a specific suit
   */
  createSuitCards(suit: CardSuit): Card[] {
    const values = Object.values(CardValue)
    const suitChar = suit.charAt(0).toUpperCase()
    return values.map(value => this.createCard(`${suitChar}${value}`))
  }

  /**
   * Create all cards of a specific value across all suits
   */
  createValueCards(value: string): Card[] {
    const suits = Object.values(SuitEnum)
    return suits.map(suit => {
      const suitChar = suit.charAt(0).toUpperCase()
      return this.createCard(`${suitChar}${value}`)
    })
  }

  /**
   * Create all Ace cards
   */
  createAllAces(): Card[] {
    return this.createValueCards('A')
  }

  /**
   * Create all King cards
   */
  createAllKings(): Card[] {
    return this.createValueCards('K')
  }

  /**
   * Create all Queen cards
   */
  createAllQueens(): Card[] {
    return this.createValueCards('Q')
  }

  /**
   * Create all Jack cards
   */
  createAllJacks(): Card[] {
    return this.createValueCards('J')
  }

  /**
   * Create face cards (J, Q, K, A) for a specific suit
   */
  createFaceCards(suit: CardSuit): Card[] {
    const suitChar = suit.charAt(0).toUpperCase()
    return ['J', 'Q', 'K', 'A'].map(value => this.createCard(`${suitChar}${value}`))
  }

  /**
   * Create number cards (2-10) for a specific suit
   */
  createNumberCards(suit: CardSuit): Card[] {
    const suitChar = suit.charAt(0).toUpperCase()
    return ['2', '3', '4', '5', '6', '7', '8', '9', '10'].map(value => 
      this.createCard(`${suitChar}${value}`)
    )
  }

  /**
   * Create low value cards (2-6)
   */
  createLowCards(suit: CardSuit): Card[] {
    const suitChar = suit.charAt(0).toUpperCase()
    return ['2', '3', '4', '5', '6'].map(value => this.createCard(`${suitChar}${value}`))
  }

  /**
   * Create high value cards (9-A)
   */
  createHighCards(suit: CardSuit): Card[] {
    const suitChar = suit.charAt(0).toUpperCase()
    return ['9', '10', 'J', 'Q', 'K', 'A'].map(value => this.createCard(`${suitChar}${value}`))
  }

  /**
   * Create a random card from specific suit
   */
  createRandomFromSuit(suit: CardSuit): Card {
    const values = Object.values(CardValue)
    const randomValue = values[Math.floor(Math.random() * values.length)]
    const suitChar = suit.charAt(0).toUpperCase()
    return this.createCard(`${suitChar}${randomValue}`)
  }

  /**
   * Create random cards with specific count
   */
  createRandomCards(count: number): Card[] {
    const suits = Object.values(SuitEnum)
    const values = Object.values(CardValue)
    const cards: Card[] = []

    for (let i = 0; i < count; i++) {
      const randomSuit = suits[Math.floor(Math.random() * suits.length)]
      const randomValue = values[Math.floor(Math.random() * values.length)]
      const suitChar = randomSuit.charAt(0).toUpperCase()
      cards.push(this.createCard(`${suitChar}${randomValue}`))
    }

    return cards
  }

  /**
   * Create cards for power chain testing
   */
  createPowerChainCards(suit: CardSuit, count: number): Card[] {
    const cards = this.createSuitCards(suit)
    return cards.slice(0, count)
  }

  /**
   * Create joust scenario cards (high value cards for competition)
   */
  createJoustCards(): { attacker: Card[], defender: Card[] } {
    return {
      attacker: this.createCards(['SA', 'HK', 'DQ']), // High attack cards
      defender: this.createCards(['SK', 'SQ', 'HJ'])  // High defense cards
    }
  }

  /**
   * Create specific hand compositions for testing
   */
  createTestHands(): {
    balanced: Card[],
    allOneColor: Card[],
    highValue: Card[],
    lowValue: Card[],
    mixed: Card[]
  } {
    return {
      balanced: this.createCards(['H5', 'D7', 'C9', 'SJ', 'HQ']),
      allOneColor: this.createCards(['H2', 'H6', 'H9', 'HK', 'HA']), // All red/hearts
      highValue: this.createCards(['HK', 'DQ', 'CJ', 'SA', 'H10']),
      lowValue: this.createCards(['H2', 'D3', 'C4', 'S5', 'H6']),
      mixed: this.createCards(['HA', 'D2', 'CK', 'S5', 'H7'])
    }
  }

  /**
   * Create court card scenarios
   */
  createCourtScenarios(): {
    royal: Card[],
    balanced: Card[],
    aggressive: Card[],
    defensive: Card[]
  } {
    return {
      royal: this.createCards(['HK', 'DQ', 'CJ']), // All face cards
      balanced: this.createCards(['H7', 'DA', 'S5']), // Mixed values
      aggressive: this.createCards(['SA', 'SK', 'SQ']), // All spades for striking
      defensive: this.createCards(['HA', 'HK', 'HQ']) // All hearts for rescue
    }
  }
}

/**
 * Pre-built card scenarios for common test cases
 */
export class CardScenarios {
  private factory: CardFactory

  constructor() {
    this.factory = new CardFactory()
  }

  /**
   * Starting hand scenario - 5 cards + 3 court
   */
  getStartingHands(): { white: Card[], black: Card[], whiteCourt: Card[], blackCourt: Card[] } {
    return {
      white: this.factory.createCards(['H5', 'D7', 'C2', 'S9', 'H10']),
      black: this.factory.createCards(['S3', 'D4', 'H8', 'CJ', 'DQ']),
      whiteCourt: this.factory.createCards(['HK', 'D5', 'S6']),
      blackCourt: this.factory.createCards(['SA', 'C9', 'H7'])
    }
  }

  /**
   * Power chain scenario - consecutive same suit cards
   */
  getPowerChainScenario(suit: CardSuit): { 
    firstCard: Card, 
    secondCard: Card, 
    extraCards: Card[] 
  } {
    const suitCards = this.factory.createSuitCards(suit)
    return {
      firstCard: suitCards[0],
      secondCard: suitCards[1],
      extraCards: suitCards.slice(2, 5)
    }
  }

  /**
   * Joust scenario - high vs high cards
   */
  getJoustScenario(): { 
    attackCard: Card, 
    defendCards: Card[], 
    targetPiece: string 
  } {
    return {
      attackCard: this.factory.createCard('SA'), // Ace of Spades
      defendCards: this.factory.createCards(['SK', 'DQ', 'HJ']), // High value defense options
      targetPiece: 'e5' // Target square for strike
    }
  }

  /**
   * Ace effects scenario - all aces for special powers
   */
  getAceEffectsScenario(): {
    heartsAce: Card,
    diamondsAce: Card, 
    clubsAce: Card,
    spadesAce: Card
  } {
    return {
      heartsAce: this.factory.createCard('HA'),
      diamondsAce: this.factory.createCard('DA'),
      clubsAce: this.factory.createCard('CA'),
      spadesAce: this.factory.createCard('SA')
    }
  }

  /**
   * Endgame scenario - few remaining cards
   */
  getEndgameScenario(): { white: Card[], black: Card[] } {
    return {
      white: this.factory.createCards(['HA', 'SA']), // Just two powerful cards
      black: this.factory.createCards(['DK', 'CQ'])  // Two strong cards
    }
  }

  /**
   * Complex scenario with multiple power chains
   */
  getComplexScenario(): {
    whiteCards: Card[],
    blackCards: Card[],
    whiteCourt: Card[],
    blackCourt: Card[],
    powerChainCards: { hearts: Card[], spades: Card[] }
  } {
    return {
      whiteCards: this.factory.createCards(['H5', 'H8', 'HJ', 'S3', 'S7']),
      blackCards: this.factory.createCards(['D2', 'D9', 'DK', 'C4', 'C10']),
      whiteCourt: this.factory.createCards(['HK', 'SA', 'DQ']),
      blackCourt: this.factory.createCards(['DA', 'CJ', 'S6']),
      powerChainCards: {
        hearts: this.factory.createCards(['H2', 'H4', 'H7']),
        spades: this.factory.createCards(['S2', 'S5', 'S9'])
      }
    }
  }

  /**
   * Edge case scenario - extreme card distributions
   */
  getEdgeCaseScenario(): {
    allAces: Card[],
    allTwos: Card[],
    oneSuit: Card[],
    mixed: Card[]
  } {
    return {
      allAces: this.factory.createAllAces(),
      allTwos: this.factory.createValueCards('2'),
      oneSuit: this.factory.createSuitCards(SuitEnum.HEARTS),
      mixed: this.factory.createRandomCards(8)
    }
  }
}

/**
 * Utility functions for card manipulation in tests
 */
export const CardTestUtils = {
  /**
   * Check if card is an Ace
   */
  isAce(card: Card): boolean {
    return card.value === 'A'
  },

  /**
   * Check if card is face card (J, Q, K, A)
   */
  isFaceCard(card: Card): boolean {
    return ['J', 'Q', 'K', 'A'].includes(card.value)
  },

  /**
   * Get card numeric value for comparison
   */
  getCardValue(card: Card): number {
    const valueMap: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
    return valueMap[card.value] || 0
  },

  /**
   * Compare cards for joust (higher wins)
   */
  compareCards(card1: Card, card2: Card): number {
    const value1 = this.getCardValue(card1)
    const value2 = this.getCardValue(card2)
    return value1 - value2
  },

  /**
   * Check if cards form a power chain sequence
   */
  canFormPowerChain(cards: Card[]): boolean {
    if (cards.length < 2) return false
    const firstSuit = cards[0].suit
    return cards.every(card => card.suit === firstSuit)
  },

  /**
   * Sort cards by value (low to high)
   */
  sortByValue(cards: Card[]): Card[] {
    return cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
  },

  /**
   * Group cards by suit
   */
  groupBySuit(cards: Card[]): Record<CardSuit, Card[]> {
    const groups: Record<CardSuit, Card[]> = {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    }

    for (const card of cards) {
      groups[card.suit].push(card)
    }

    return groups
  },

  /**
   * Get cards that can trigger power chains
   */
  getPowerChainTriggers(cards: Card[]): CardSuit[] {
    const suitCounts = this.groupBySuit(cards)
    const triggers: CardSuit[] = []

    for (const [suit, suitCards] of Object.entries(suitCounts)) {
      if (suitCards.length >= 2) {
        triggers.push(suit as CardSuit)
      }
    }

    return triggers
  }
}

// Export convenience instance
export const cardFactory = new CardFactory()
export const cardScenarios = new CardScenarios()