/**
 * Technical Spike: Power Chains Mechanic
 * 
 * This file demonstrates and tests the Power Chain functionality
 * Power Chains activate when a player plays two cards of the same suit in consecutive turns
 */

import { RoyalGambitGame } from './RoyalGambitGame'
import { CardSystem } from './CardSystem'
import type { Card, CardSuit } from './types'
import { CardSuit as CardSuitEnum } from './types'

export class PowerChainSpike {
  private game: RoyalGambitGame
  private cardSystem: CardSystem

  constructor() {
    this.game = new RoyalGambitGame()
    this.cardSystem = new CardSystem()
  }

  /**
   * Test basic Power Chain detection
   */
  testPowerChainDetection(): void {
    console.log('=== Testing Power Chain Detection ===')
    
    // Create test cards
    const heart5 = this.cardSystem.createCard('H5')!
    const heartK = this.cardSystem.createCard('HK')!
    const spade3 = this.cardSystem.createCard('S3')!
    
    console.log('Initial power chain status:', this.game.getPowerChainStatus())
    
    // First Hearts card - no power chain yet
    console.log('\n1. Playing first Hearts card...')
    this.playTestCard(heart5)
    console.log('Power chain status:', this.game.getPowerChainStatus())
    
    // Make a chess move to change turns
    this.game.makeChessMove('e2', 'e4')
    console.log('After chess move, power chain status:', this.game.getPowerChainStatus())
    
    // Second Hearts card - should activate power chain
    console.log('\n2. Playing second Hearts card...')
    this.playTestCard(heartK)
    console.log('Power chain status:', this.game.getPowerChainStatus())
    
    // Different suit - should reset power chain
    console.log('\n3. Playing different suit card...')
    this.playTestCard(spade3)
    console.log('Power chain status:', this.game.getPowerChainStatus())
  }

  /**
   * Test Power Chain effects for different suits
   */
  testPowerChainEffects(): void {
    console.log('\n=== Testing Power Chain Effects ===')
    
    const suits: CardSuit[] = [CardSuitEnum.HEARTS, CardSuitEnum.DIAMONDS, CardSuitEnum.CLUBS, CardSuitEnum.SPADES]
    
    suits.forEach(suit => {
      console.log(`\nTesting ${suit} Power Chain:`)
      this.testSuitPowerChain(suit)
    })
  }

  private testSuitPowerChain(suit: CardSuit): void {
    const card1 = this.cardSystem.createCard(`${suit.charAt(0).toUpperCase()}5`)!
    const card2 = this.cardSystem.createCard(`${suit.charAt(0).toUpperCase()}K`)!
    
    // Play first card
    console.log(`  1. Playing first ${suit} card (${card1.id})`)
    this.playTestCard(card1)
    
    // Make chess move to maintain same player
    this.game.makeChessMove('d2', 'd4')
    
    // Play second card (should trigger power chain)
    console.log(`  2. Playing second ${suit} card (${card2.id}) - Power Chain should activate`)
    this.playTestCard(card2)
    
    const chainStatus = this.game.getPowerChainStatus()
    console.log(`  Result: Chain count = ${chainStatus.count}, Active suit = ${chainStatus.suit}`)
  }

  /**
   * Test cross-turn power chain persistence
   */
  testCrossTurnPersistence(): void {
    console.log('\n=== Testing Cross-Turn Persistence ===')
    
    const heart2 = this.cardSystem.createCard('H2')!
    const heartA = this.cardSystem.createCard('HA')!
    
    console.log('1. White plays Hearts card')
    this.playTestCard(heart2)
    
    console.log('2. Black makes a chess move')
    this.game.makeChessMove('e7', 'e5')
    
    console.log('3. White plays another Hearts card (should NOT be power chain - different player)')
    this.playTestCard(heartA)
    
    console.log('Final power chain status:', this.game.getPowerChainStatus())
  }

  /**
   * Simulate game sequence with multiple power chains
   */
  simulateGameSequence(): void {
    console.log('\n=== Simulating Game Sequence ===')
    
    const moves = [
      { type: 'card', card: 'H3', description: 'White plays Hearts 3' },
      { type: 'move', from: 'e7', to: 'e6', description: 'Black moves pawn' },
      { type: 'card', card: 'H7', description: 'White plays Hearts 7 (Power Chain!)' },
      { type: 'move', from: 'd7', to: 'd6', description: 'Black moves pawn' },
      { type: 'card', card: 'S2', description: 'White plays Spades 2 (resets chain)' },
      { type: 'card', card: 'SK', description: 'Black plays Spades King' },
      { type: 'move', from: 'g1', to: 'f3', description: 'White moves knight' },
      { type: 'card', card: 'SA', description: 'Black plays Spades Ace (Power Chain!)' }
    ]

    moves.forEach((move, index) => {
      console.log(`\n${index + 1}. ${move.description}`)
      
      if (move.type === 'card') {
        const card = this.cardSystem.createCard((move as any).card)!
        this.playTestCard(card)
      } else {
        this.game.makeChessMove((move as any).from, (move as any).to)
      }
      
      console.log(`   Power chain: ${JSON.stringify(this.game.getPowerChainStatus())}`)
    })
  }

  private playTestCard(card: Card): void {
    // Add card to current player's hand for testing
    const gameState = this.game.getGameState()
    gameState.hands[gameState.currentPlayer].push(card)
    
    // Play the card (simplified for testing)
    console.log(`   Playing ${card.id} (${card.suit} ${card.value})`)
    
    // For this spike, we'll just simulate the effect without full implementation
    this.game.playCard(card.id, 'e4') // Using e4 as dummy target
  }

  /**
   * Run all tests
   */
  runAllTests(): void {
    console.log('🎯 ROYAL GAMBIT POWER CHAIN TECHNICAL SPIKE 🎯\n')
    
    try {
      this.testPowerChainDetection()
      this.testPowerChainEffects()
      this.testCrossTurnPersistence()
      this.simulateGameSequence()
      
      console.log('\n✅ All Power Chain tests completed successfully!')
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }
}

// Export function to run the spike
export function runPowerChainSpike(): void {
  const spike = new PowerChainSpike()
  spike.runAllTests()
}