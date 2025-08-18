import { Chess, type Square } from 'chess.js'
import type { Card, CardSuit, GameState, GameEvent, ChessMove, CardPlay, CardEffect } from './types'
import { CardSystem } from './CardSystem'

/**
 * RoyalGambitGame extends chess.js to add Royal Gambit card mechanics
 * 
 * Key features:
 * - Standard chess rules with card-based special powers
 * - Power Chains: consecutive same-suit cards get boosted effects
 * - Court cards: 3 face-up cards per player
 * - Event sourcing: all actions are recorded as events
 */
export class RoyalGambitGame extends Chess {
  private gameState: GameState
  private cardSystem: CardSystem

  constructor() {
    super()
    this.cardSystem = new CardSystem()
    this.gameState = this.initializeGameState()
  }

  private initializeGameState(): GameState {
    // Deal initial cards: 5 to hand, 3 to court for each player
    const whiteHand = this.cardSystem.dealCards(5)
    const blackHand = this.cardSystem.dealCards(5)
    const whiteCourt = this.cardSystem.dealCards(3)
    const blackCourt = this.cardSystem.dealCards(3)

    return {
      currentPlayer: this.turn() === 'w' ? 'white' : 'black',
      hands: {
        white: whiteHand,
        black: blackHand
      },
      courtCards: {
        white: whiteCourt,
        black: blackCourt
      },
      powerChains: {
        white: { suit: null, count: 0 },
        black: { suit: null, count: 0 }
      },
      moveHistory: [],
      lastCardPlayed: null
    }
  }

  /**
   * Make a standard chess move
   */
  makeChessMove(from: string, to: string, promotion?: string): boolean {
    const move = { from, to, promotion }
    
    try {
      const result = this.move(move)
      if (result) {
        this.recordEvent({
          type: 'move',
          data: move,
          player: this.gameState.currentPlayer,
          timestamp: Date.now()
        })
        this.syncTurnWithChess()
        return true
      }
      return false
    } catch (error) {
      console.error('Invalid chess move:', error)
      return false
    }
  }

  private syncTurnWithChess(): void {
    // Sync game state turn with chess.js turn after chess moves
    const chessTurn = this.turn()
    this.gameState.currentPlayer = chessTurn === 'w' ? 'white' : 'black'
  }

  /**
   * Play a card from hand or court
   */
  playCard(cardId: string, target?: string, fromCourt = false): boolean {
    const currentPlayer = this.gameState.currentPlayer
    const sourceCards = fromCourt 
      ? this.gameState.courtCards[currentPlayer]
      : this.gameState.hands[currentPlayer]

    const cardIndex = sourceCards.findIndex(card => card.id === cardId)
    if (cardIndex === -1) {
      console.error('Card not found in hand/court')
      return false
    }

    const card = sourceCards[cardIndex]
    const effect = this.calculateCardEffect(card)

    // Validate card play
    if (!this.isValidCardPlay(card, effect, target)) {
      return false
    }

    // Apply card effect to chess board
    const success = this.applyCardEffect(card, effect, target)
    if (!success) {
      return false
    }

    // Remove card from hand/court
    sourceCards.splice(cardIndex, 1)

    // If from court, replace immediately
    if (fromCourt) {
      const newCard = this.cardSystem.drawCard()
      if (newCard) {
        this.gameState.courtCards[currentPlayer].push(newCard)
      }
    }

    // Record the event
    this.recordEvent({
      type: 'card',
      data: {
        card,
        effect,
        target
      },
      player: currentPlayer,
      timestamp: Date.now()
    })

    // Update power chain
    this.updatePowerChain(card.suit)

    this.endTurn()
    return true
  }

  private calculateCardEffect(card: Card): CardEffect {
    const isAce = card.value === 'A'
    const isPowerChain = this.isPowerChainActive(card.suit)

    let type: CardEffect['type']
    switch (card.suit) {
      case 'hearts':
        type = 'rescue'
        break
      case 'diamonds':
        type = 'upgrade'
        break
      case 'clubs':
        type = 'swap'
        break
      case 'spades':
        type = 'strike'
        break
      default:
        type = 'rescue' // fallback
    }

    return { type, isAce, isPowerChain }
  }

  private isPowerChainActive(suit: CardSuit): boolean {
    const player = this.gameState.currentPlayer
    const lastPlayed = this.gameState.lastCardPlayed
    
    return lastPlayed?.player === player && lastPlayed.card.suit === suit
  }

  private isValidCardPlay(card: Card, effect: CardEffect, target?: string): boolean {
    // Basic validation - can be expanded based on specific rules
    switch (effect.type) {
      case 'rescue':
        // Hearts: Must target an empty square to move piece to
        return target ? !this.get(target as Square) : false
      
      case 'upgrade':
        // Diamonds: Must target a pawn (or any piece if Ace)
        if (effect.isAce) return target ? this.isOwnPiece(target) : false
        return target ? this.isOwnPawn(target) : false
      
      case 'swap':
        // Clubs: Always valid (targets determined in effect application)
        return true
      
      case 'strike':
        // Spades: Must target opponent piece (King if Ace + in check)
        if (effect.isAce) {
          return target === this.getOpponentKingSquare() && this.inCheck()
        }
        return target ? this.isOpponentPiece(target) : false
      
      default:
        return false
    }
  }

  private applyCardEffect(card: Card, effect: CardEffect, target?: string): boolean {
    try {
      switch (effect.type) {
        case 'rescue':
          return this.applyRescueEffect(card, effect, target!)
        
        case 'upgrade':
          return this.applyUpgradeEffect(card, effect, target!)
        
        case 'swap':
          return this.applySwapEffect(card, effect)
        
        case 'strike':
          return this.applyStrikeEffect(card, effect, target!)
        
        default:
          return false
      }
    } catch (error) {
      console.error('Error applying card effect:', error)
      return false
    }
  }

  private applyRescueEffect(card: Card, effect: CardEffect, target: string): boolean {
    // Hearts: Move piece to any empty square
    console.log(`RESCUE: Moving piece from ${target} (effect: ${effect.isPowerChain ? 'Power Chain' : 'Normal'})`)
    
    // Check if target square is empty
    const targetPiece = this.get(target as Square)
    if (targetPiece) {
      return false // Cannot rescue to occupied square
    }
    
    // Find a piece to rescue (prioritize King if in check, otherwise any own piece)
    const currentColor = this.turn()
    let pieceToRescue = null
    let fromSquare = null
    
    // If Ace and King is in check, rescue the King
    if (effect.isAce && this.inCheck()) {
      const board = this.board()
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file]
          if (piece && piece.type === 'k' && piece.color === currentColor) {
            fromSquare = String.fromCharCode(97 + file) + (8 - rank)
            pieceToRescue = piece
            break
          }
        }
        if (pieceToRescue) break
      }
    } else {
      // Find any own piece to rescue (prefer pieces under attack or with limited mobility)
      const board = this.board()
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file]
          if (piece && piece.color === currentColor) {
            fromSquare = String.fromCharCode(97 + file) + (8 - rank)
            pieceToRescue = piece
            break // Take first available piece for now
          }
        }
        if (pieceToRescue) break
      }
    }
    
    if (!pieceToRescue || !fromSquare) {
      return false
    }
    
    // Remove piece from current position and place at target
    this.remove(fromSquare as Square)
    this.put(pieceToRescue, target as Square)
    
    return true
  }

  private applyUpgradeEffect(card: Card, effect: CardEffect, target: string): boolean {
    // Diamonds: Promote pawn to queen (or any piece if Ace)
    console.log(`UPGRADE: Promoting piece at ${target} (Ace: ${effect.isAce}, Power Chain: ${effect.isPowerChain})`)
    
    const piece = this.get(target as Square)
    if (!piece || piece.color !== this.turn()) {
      return false // Can only upgrade own pieces
    }
    
    // For normal Diamonds, only upgrade pawns to queens
    if (!effect.isAce && piece.type !== 'p') {
      return false
    }
    
    // Remove old piece and place upgraded piece
    this.remove(target as Square)
    
    if (effect.isAce) {
      // Ace can upgrade any piece to any piece (default to queen)
      this.put({ type: 'q', color: piece.color }, target as Square)
    } else {
      // Normal diamonds: pawn to queen
      this.put({ type: 'q', color: piece.color }, target as Square)
    }
    
    return true
  }

  private applySwapEffect(card: Card, effect: CardEffect): boolean {
    // Clubs: Swap two pieces
    console.log(`SWAP: Swapping pieces (Ace: ${effect.isAce}, Power Chain: ${effect.isPowerChain})`)
    
    // For now, implement a simple version that swaps two own pieces
    // This needs to be improved to handle targeting specific pieces
    const board = this.board()
    const currentColor = this.turn()
    const ownPieces = []
    
    // Find own pieces
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === currentColor) {
          const square = String.fromCharCode(97 + file) + (8 - rank)
          ownPieces.push({ piece, square })
        }
      }
    }
    
    // Swap first two pieces found (simplified implementation)
    if (ownPieces.length >= 2) {
      const piece1 = ownPieces[0]
      const piece2 = ownPieces[1]
      
      this.remove(piece1.square as Square)
      this.remove(piece2.square as Square)
      this.put(piece1.piece, piece2.square as Square)
      this.put(piece2.piece, piece1.square as Square)
      
      return true
    }
    
    return false
  }

  private applyStrikeEffect(card: Card, effect: CardEffect, target: string): boolean {
    // Spades: Remove opponent piece
    const piece = this.get(target as Square)
    if (piece && piece.color !== this.turn()) {
      this.remove(target as Square)
      console.log(`STRIKE: Removed ${piece.type} from ${target}`)
      return true
    }
    return false
  }

  private updatePowerChain(suit: CardSuit): void {
    const player = this.gameState.currentPlayer
    const playerChain = this.gameState.powerChains[player]

    if (playerChain.suit === suit) {
      playerChain.count++
    } else {
      playerChain.suit = suit
      playerChain.count = 1
    }

    this.gameState.lastCardPlayed = {
      player,
      card: { suit, value: 'A' as any, id: 'temp' } // Simplified for tracking
    }
  }

  private endTurn(): void {
    // Draw a card to maintain hand size of 5
    const currentPlayer = this.gameState.currentPlayer
    if (this.gameState.hands[currentPlayer].length < 5) {
      const newCard = this.cardSystem.drawCard()
      if (newCard) {
        this.gameState.hands[currentPlayer].push(newCard)
      }
    }

    // Switch turns for card plays (independent of chess moves)
    this.gameState.currentPlayer = this.gameState.currentPlayer === 'white' ? 'black' : 'white'
  }

  private recordEvent(event: GameEvent): void {
    this.gameState.moveHistory.push(event)
  }

  private isOwnPiece(square: string): boolean {
    const piece = this.get(square as Square)
    return piece ? piece.color === this.turn() : false
  }

  private isOwnPawn(square: string): boolean {
    const piece = this.get(square as Square)
    return piece ? piece.color === this.turn() && piece.type === 'p' : false
  }

  private isOpponentPiece(square: string): boolean {
    const piece = this.get(square as Square)
    return piece ? piece.color !== this.turn() : false
  }

  private getOpponentKingSquare(): string {
    const board = this.board()
    const opponentColor = this.turn() === 'w' ? 'b' : 'w'
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.type === 'k' && piece.color === opponentColor) {
          return String.fromCharCode(97 + file) + (8 - rank)
        }
      }
    }
    return ''
  }

  // Getters for game state
  getGameState(): GameState {
    return { ...this.gameState }
  }

  getCurrentPlayerHand(): Card[] {
    return [...this.gameState.hands[this.gameState.currentPlayer]]
  }

  getCurrentPlayerCourt(): Card[] {
    return [...this.gameState.courtCards[this.gameState.currentPlayer]]
  }

  getPowerChainStatus(): { suit: CardSuit | null; count: number } {
    return { ...this.gameState.powerChains[this.gameState.currentPlayer] }
  }
}