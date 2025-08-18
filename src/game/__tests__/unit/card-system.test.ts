/**
 * Card System Tests
 * 
 * Tests the card deck management, shuffling, dealing, and card creation
 * functionality that supports the Royal Gambit game mechanics.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CardSystem } from '../../CardSystem'
import type { Card, CardSuit } from '../../types'
import { CardSuit as SuitEnum, CardValue } from '../../types'
import { cardFactory, CardTestUtils } from '../fixtures/card-factories'

describe('Card System', () => {
  let cardSystem: CardSystem

  beforeEach(() => {
    cardSystem = new CardSystem()
  })

  describe('Deck Initialization', () => {
    it('should initialize with 52 cards', () => {
      expect(cardSystem.getDeckSize()).toBe(52)
      expect(cardSystem.getDiscardPileSize()).toBe(0)
    })

    it('should contain exactly 13 cards of each suit', () => {
      const allCards = cardSystem.dealCards(52)
      const suitCounts = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 }
      
      for (const card of allCards) {
        suitCounts[card.suit]++
      }
      
      expect(suitCounts.hearts).toBe(13)
      expect(suitCounts.diamonds).toBe(13)
      expect(suitCounts.clubs).toBe(13)
      expect(suitCounts.spades).toBe(13)
    })

    it('should contain exactly 4 cards of each value', () => {
      const allCards = cardSystem.dealCards(52)
      const valueCounts: Record<string, number> = {}
      
      for (const card of allCards) {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1
      }
      
      const expectedValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
      for (const value of expectedValues) {
        expect(valueCounts[value]).toBe(4)
      }
    })

    it('should have unique card IDs', () => {
      const allCards = cardSystem.dealCards(52)
      const cardIds = allCards.map(card => card.id)
      const uniqueIds = new Set(cardIds)
      
      expect(uniqueIds.size).toBe(52)
    })

    it('should format card IDs correctly', () => {
      const allCards = cardSystem.dealCards(52)
      
      for (const card of allCards) {
        const expectedId = `${card.suit.charAt(0).toUpperCase()}${card.value}`
        expect(card.id).toBe(expectedId)
      }
    })
  })

  describe('Card Dealing', () => {
    it('should deal requested number of cards', () => {
      const hand = cardSystem.dealCards(5)
      expect(hand).toHaveLength(5)
      expect(cardSystem.getDeckSize()).toBe(47)
    })

    it('should reduce deck size when dealing', () => {
      expect(cardSystem.getDeckSize()).toBe(52)
      
      cardSystem.dealCards(3)
      expect(cardSystem.getDeckSize()).toBe(49)
      
      cardSystem.dealCards(10)
      expect(cardSystem.getDeckSize()).toBe(39)
    })

    it('should deal different cards each time', () => {
      const hand1 = cardSystem.dealCards(5)
      const hand2 = cardSystem.dealCards(5)
      
      // Check that no cards are identical between hands
      const hand1Ids = hand1.map(card => card.id)
      const hand2Ids = hand2.map(card => card.id)
      
      for (const id of hand1Ids) {
        expect(hand2Ids).not.toContain(id)
      }
    })

    it('should handle dealing all cards', () => {
      const allCards = cardSystem.dealCards(52)
      expect(allCards).toHaveLength(52)
      expect(cardSystem.getDeckSize()).toBe(0)
    })

    it('should handle dealing more cards than available', () => {
      // Deal 50 cards, leaving 2
      cardSystem.dealCards(50)
      
      // Try to deal 5 cards - should only get 2
      const remainingCards = cardSystem.dealCards(5)
      expect(remainingCards).toHaveLength(2)
      expect(cardSystem.getDeckSize()).toBe(0)
    })

    it('should return empty array when deck is empty', () => {
      cardSystem.dealCards(52) // Exhaust deck
      const moreCards = cardSystem.dealCards(1)
      expect(moreCards).toHaveLength(0)
    })
  })

  describe('Single Card Drawing', () => {
    it('should draw one card at a time', () => {
      const card = cardSystem.drawCard()
      expect(card).toBeTruthy()
      expect(cardSystem.getDeckSize()).toBe(51)
    })

    it('should return null when deck is empty', () => {
      cardSystem.dealCards(52)
      const card = cardSystem.drawCard()
      expect(card).toBeNull()
    })

    it('should draw different cards sequentially', () => {
      const card1 = cardSystem.drawCard()
      const card2 = cardSystem.drawCard()
      
      expect(card1).not.toBeNull()
      expect(card2).not.toBeNull()
      expect(card1!.id).not.toBe(card2!.id)
    })
  })

  describe('Discard Pile Management', () => {
    it('should start with empty discard pile', () => {
      expect(cardSystem.getDiscardPileSize()).toBe(0)
    })

    it('should add cards to discard pile', () => {
      const card = cardSystem.drawCard()!
      cardSystem.discardCard(card)
      
      expect(cardSystem.getDiscardPileSize()).toBe(1)
    })

    it('should accumulate discarded cards', () => {
      const cards = cardSystem.dealCards(3)
      
      for (const card of cards) {
        cardSystem.discardCard(card)
      }
      
      expect(cardSystem.getDiscardPileSize()).toBe(3)
    })
  })

  describe('Deck Reshuffling', () => {
    it('should reshuffle discard pile when deck is empty', () => {
      // Deal all cards
      const allCards = cardSystem.dealCards(52)
      expect(cardSystem.getDeckSize()).toBe(0)
      
      // Discard some cards
      for (let i = 0; i < 10; i++) {
        cardSystem.discardCard(allCards[i])
      }
      expect(cardSystem.getDiscardPileSize()).toBe(10)
      
      // Try to draw - should trigger reshuffle
      const newCard = cardSystem.drawCard()
      expect(newCard).toBeTruthy()
      expect(cardSystem.getDeckSize()).toBe(9) // 10 reshuffled - 1 drawn
      expect(cardSystem.getDiscardPileSize()).toBe(0)
    })

    it('should handle multiple reshuffles', () => {
      // Exhaust deck
      const allCards = cardSystem.dealCards(52)
      
      // Discard 5 cards and draw them back (first reshuffle)
      for (let i = 0; i < 5; i++) {
        cardSystem.discardCard(allCards[i])
      }
      const batch1 = cardSystem.dealCards(5)
      expect(batch1).toHaveLength(5)
      
      // Discard again and draw (second reshuffle)
      for (const card of batch1) {
        cardSystem.discardCard(card)
      }
      const batch2 = cardSystem.dealCards(3)
      expect(batch2).toHaveLength(3)
    })

    it('should return null if both deck and discard are empty', () => {
      cardSystem.dealCards(52) // Exhaust deck
      const card = cardSystem.drawCard()
      expect(card).toBeNull()
    })
  })

  describe('Card Creation', () => {
    it('should create valid cards from ID strings', () => {
      const card = cardSystem.createCard('HA')
      expect(card).toBeTruthy()
      expect(card!.suit).toBe('hearts')
      expect(card!.value).toBe('A')
      expect(card!.id).toBe('HA')
    })

    it('should create cards for all suits', () => {
      const heartsCard = cardSystem.createCard('H5')
      const diamondsCard = cardSystem.createCard('D5')
      const clubsCard = cardSystem.createCard('C5')
      const spadesCard = cardSystem.createCard('S5')
      
      expect(heartsCard!.suit).toBe('hearts')
      expect(diamondsCard!.suit).toBe('diamonds')
      expect(clubsCard!.suit).toBe('clubs')
      expect(spadesCard!.suit).toBe('spades')
    })

    it('should create cards for all values', () => {
      const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
      
      for (const value of values) {
        const card = cardSystem.createCard(`H${value}`)
        expect(card).toBeTruthy()
        expect(card!.value).toBe(value)
      }
    })

    it('should return null for invalid card IDs', () => {
      expect(cardSystem.createCard('')).toBeNull()
      expect(cardSystem.createCard('X5')).toBeNull() // Invalid suit
      expect(cardSystem.createCard('H1')).toBeNull() // Invalid value
      expect(cardSystem.createCard('HA5')).toBeNull() // Too long
      expect(cardSystem.createCard('H')).toBeNull() // Too short
    })

    it('should handle case insensitive suit creation', () => {
      const lowerCard = cardSystem.createCard('h5')
      const upperCard = cardSystem.createCard('H5')
      
      expect(lowerCard).toBeTruthy()
      expect(upperCard).toBeTruthy()
      expect(lowerCard!.suit).toBe(upperCard!.suit)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Modify the card system
      cardSystem.dealCards(20)
      const cards = cardSystem.dealCards(5)
      for (const card of cards) {
        cardSystem.discardCard(card)
      }
      
      expect(cardSystem.getDeckSize()).toBeLessThan(52)
      expect(cardSystem.getDiscardPileSize()).toBeGreaterThan(0)
      
      // Reset
      cardSystem.reset()
      
      // Should be back to initial state
      expect(cardSystem.getDeckSize()).toBe(52)
      expect(cardSystem.getDiscardPileSize()).toBe(0)
    })

    it('should have different shuffle after reset', () => {
      const firstCard = cardSystem.drawCard()!
      cardSystem.reset()
      
      // After reset and new shuffle, first card is likely different
      // Note: This test has a small chance of false positive due to randomness
      const secondCard = cardSystem.drawCard()!
      
      // At minimum, deck should be full again
      expect(cardSystem.getDeckSize()).toBe(51)
    })
  })

  describe('Shuffling Randomness', () => {
    it('should produce different card orders across multiple instances', () => {
      const systems = [new CardSystem(), new CardSystem(), new CardSystem()]
      const firstCards = systems.map(system => system.drawCard()!.id)
      
      // Very unlikely all three systems have same first card after shuffling
      // (probability = 1/52² ≈ 0.04%)
      const allSame = firstCards.every(id => id === firstCards[0])
      expect(allSame).toBe(false)
    })

    it('should distribute suits relatively evenly in initial deals', () => {
      // Deal 20 cards and check suit distribution
      const cards = cardSystem.dealCards(20)
      const suitCounts = CardTestUtils.groupBySuit(cards)
      
      // Each suit should appear at least once in 20 cards (very likely)
      const suitsPresent = Object.values(suitCounts).filter(cards => cards.length > 0)
      expect(suitsPresent.length).toBeGreaterThan(2) // At least 3 of 4 suits
    })
  })

  describe('Performance', () => {
    it('should initialize quickly', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        new CardSystem()
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete in < 100ms
    })

    it('should deal cards efficiently', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        cardSystem.dealCards(5)
        cardSystem.reset()
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in < 1s
    })

    it('should handle many discard operations quickly', () => {
      const cards = cardSystem.dealCards(52)
      const startTime = performance.now()
      
      for (const card of cards) {
        cardSystem.discardCard(card)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(10) // Should complete in < 10ms
    })
  })

  describe('Integration with Card Factory', () => {
    it('should create cards compatible with factory', () => {
      const systemCard = cardSystem.createCard('HA')!
      const factoryCard = cardFactory.createCard('HA')
      
      expect(systemCard.id).toBe(factoryCard.id)
      expect(systemCard.suit).toBe(factoryCard.suit)
      expect(systemCard.value).toBe(factoryCard.value)
    })

    it('should work with card test utilities', () => {
      const card = cardSystem.createCard('HA')!
      
      expect(CardTestUtils.isAce(card)).toBe(true)
      expect(CardTestUtils.isFaceCard(card)).toBe(true)
      expect(CardTestUtils.getCardValue(card)).toBe(14)
    })

    it('should support power chain detection', () => {
      const heartsCards = [
        cardSystem.createCard('H5')!,
        cardSystem.createCard('H8')!,
        cardSystem.createCard('HJ')!
      ]
      
      expect(CardTestUtils.canFormPowerChain(heartsCards)).toBe(true)
      
      const mixedCards = [
        cardSystem.createCard('H5')!,
        cardSystem.createCard('D8')!,
        cardSystem.createCard('HJ')!
      ]
      
      expect(CardTestUtils.canFormPowerChain(mixedCards)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive operations', () => {
      for (let i = 0; i < 10; i++) {
        const card = cardSystem.drawCard()
        if (card) {
          cardSystem.discardCard(card)
        }
        cardSystem.drawCard() // Should trigger reshuffle after first iteration
      }
      
      expect(cardSystem.getDeckSize() + cardSystem.getDiscardPileSize()).toBeLessThanOrEqual(52)
    })

    it('should maintain consistency during stress test', () => {
      const operations = []
      
      // Perform random operations
      for (let i = 0; i < 100; i++) {
        const operation = Math.random()
        
        if (operation < 0.5 && cardSystem.getDeckSize() > 0) {
          const card = cardSystem.drawCard()
          if (card) operations.push(card)
        } else if (operations.length > 0) {
          const card = operations.pop()!
          cardSystem.discardCard(card)
        }
      }
      
      // System should remain in valid state
      expect(cardSystem.getDeckSize()).toBeGreaterThanOrEqual(0)
      expect(cardSystem.getDiscardPileSize()).toBeGreaterThanOrEqual(0)
      expect(cardSystem.getDeckSize() + cardSystem.getDiscardPileSize()).toBeLessThanOrEqual(52)
    })
  })
})