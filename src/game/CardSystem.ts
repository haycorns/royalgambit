import type { Card, CardSuit, CardValue } from './types'
import { CardSuit as SuitEnum, CardValue as ValueEnum } from './types'

/**
 * CardSystem manages the deck of playing cards for Royal Gambit
 * Handles shuffling, dealing, and card identification
 */
export class CardSystem {
  private deck: Card[]
  private discardPile: Card[]

  constructor() {
    this.deck = []
    this.discardPile = []
    this.initializeDeck()
    this.shuffle()
  }

  private initializeDeck(): void {
    this.deck = []
    
    // Create all 52 cards
    for (const suit of Object.values(SuitEnum)) {
      for (const value of Object.values(ValueEnum)) {
        this.deck.push({
          suit,
          value,
          id: this.createCardId(suit, value)
        })
      }
    }
  }

  private createCardId(suit: CardSuit, value: CardValue): string {
    const suitPrefix = suit.charAt(0).toUpperCase() // H, D, C, S
    return `${suitPrefix}${value}`
  }

  private shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
    }
  }

  /**
   * Deal specified number of cards
   */
  dealCards(count: number): Card[] {
    const cards: Card[] = []
    
    for (let i = 0; i < count; i++) {
      const card = this.drawCard()
      if (card) {
        cards.push(card)
      } else {
        // If deck is empty, reshuffle discard pile
        this.reshuffleDiscardPile()
        const reshuffledCard = this.drawCard()
        if (reshuffledCard) {
          cards.push(reshuffledCard)
        }
      }
    }
    
    return cards
  }

  /**
   * Draw a single card from the deck
   */
  drawCard(): Card | null {
    if (this.deck.length === 0) {
      this.reshuffleDiscardPile()
    }
    
    return this.deck.pop() || null
  }

  /**
   * Add a card to the discard pile
   */
  discardCard(card: Card): void {
    this.discardPile.push(card)
  }

  /**
   * Reshuffle discard pile back into deck when deck is empty
   */
  private reshuffleDiscardPile(): void {
    if (this.discardPile.length === 0) {
      console.warn('Both deck and discard pile are empty!')
      return
    }
    
    this.deck = [...this.discardPile]
    this.discardPile = []
    this.shuffle()
    console.log('Reshuffled discard pile back into deck')
  }

  /**
   * Get remaining cards in deck
   */
  getDeckSize(): number {
    return this.deck.length
  }

  /**
   * Get discard pile size
   */
  getDiscardPileSize(): number {
    return this.discardPile.length
  }

  /**
   * Create a specific card by ID (useful for testing)
   */
  createCard(cardId: string): Card | null {
    if (cardId.length < 2) return null
    
    const suitChar = cardId.charAt(0).toLowerCase()
    const valueStr = cardId.slice(1)
    
    let suit: CardSuit
    switch (suitChar) {
      case 'h': suit = SuitEnum.HEARTS; break
      case 'd': suit = SuitEnum.DIAMONDS; break
      case 'c': suit = SuitEnum.CLUBS; break
      case 's': suit = SuitEnum.SPADES; break
      default: return null
    }
    
    const value = Object.values(ValueEnum).find(v => v === valueStr)
    if (!value) return null
    
    return {
      suit,
      value,
      id: this.createCardId(suit, value)
    }
  }

  /**
   * Reset the deck to initial state (useful for new games)
   */
  reset(): void {
    this.discardPile = []
    this.initializeDeck()
    this.shuffle()
  }
}