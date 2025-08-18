<template>
  <div class="royal-gambit-demo">
    <h1>🏰 Royal Gambit Technical Demo</h1>
    
    <div class="demo-controls">
      <button @click="runPowerChainTest" class="btn-primary">
        🔗 Test Power Chains
      </button>
      <button @click="testCardSystem" class="btn-secondary">
        🃏 Test Card System
      </button>
      <button @click="makeTestMove" class="btn-secondary">
        ♟️ Test Chess Move
      </button>
      <button @click="clearConsole" class="btn-clear">
        🧹 Clear Console
      </button>
    </div>

    <div class="game-info">
      <div class="current-player">
        <h3>Current Player: {{ gameState.currentPlayer }}</h3>
      </div>

      <div class="power-chain-status">
        <h3>Power Chain Status</h3>
        <p>Suit: {{ powerChain.suit || 'None' }}</p>
        <p>Count: {{ powerChain.count }}</p>
      </div>

      <div class="player-hand">
        <h3>{{ gameState.currentPlayer }} Hand</h3>
        <div class="cards">
          <div 
            v-for="card in currentHand" 
            :key="card.id"
            class="card"
            @click="playCard(card.id)"
          >
            {{ card.id }}
          </div>
        </div>
      </div>

      <div class="court-cards">
        <h3>{{ gameState.currentPlayer }} Court</h3>
        <div class="cards">
          <div 
            v-for="card in currentCourt" 
            :key="card.id"
            class="card court-card"
            @click="playCardFromCourt(card.id)"
          >
            {{ card.id }}
          </div>
        </div>
      </div>
    </div>

    <div class="chess-board-placeholder">
      <h3>Chess Board</h3>
      <p>{{ boardState }}</p>
      <div class="board-grid">
        <div 
          v-for="(square, index) in boardSquares" 
          :key="index"
          class="square"
          :class="{ 'light': (Math.floor(index/8) + index) % 2 === 0, 'dark': (Math.floor(index/8) + index) % 2 === 1 }"
        >
          {{ square.piece || '' }}
        </div>
      </div>
    </div>

    <div class="console-output">
      <h3>Console Output</h3>
      <div ref="consoleRef" class="console-content">
        <pre>{{ consoleOutput }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RoyalGambitGame } from '@/game/RoyalGambitGame'
import { runPowerChainSpike } from '@/game/PowerChainSpike'
import type { GameState, Card } from '@/game/types'

// Game instance
const game = ref(new RoyalGambitGame())
const gameState = ref<GameState>(game.value.getGameState())
const consoleOutput = ref('')
const consoleRef = ref<HTMLElement>()

// Computed properties
const currentHand = computed(() => game.value.getCurrentPlayerHand())
const currentCourt = computed(() => game.value.getCurrentPlayerCourt())
const powerChain = computed(() => game.value.getPowerChainStatus())
const boardState = computed(() => game.value.fen())

// Board representation for simple display
const boardSquares = computed(() => {
  const board = game.value.board()
  const squares = []
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file]
      squares.push({
        piece: piece ? `${piece.color}${piece.type}` : null,
        square: String.fromCharCode(97 + file) + (8 - rank)
      })
    }
  }
  
  return squares
})

// Console capture
const originalLog = console.log
const originalError = console.error

function captureConsole() {
  console.log = (...args) => {
    consoleOutput.value += args.join(' ') + '\n'
    originalLog(...args)
    scrollConsoleToBottom()
  }
  
  console.error = (...args) => {
    consoleOutput.value += 'ERROR: ' + args.join(' ') + '\n'
    originalError(...args)
    scrollConsoleToBottom()
  }
}

function scrollConsoleToBottom() {
  setTimeout(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  }, 100)
}

function updateGameState() {
  gameState.value = game.value.getGameState()
}

// Demo functions
function runPowerChainTest() {
  console.log('\n🔗 Running Power Chain Technical Spike...')
  runPowerChainSpike()
  updateGameState()
}

function testCardSystem() {
  console.log('\n🃏 Testing Card System...')
  const hand = game.value.getCurrentPlayerHand()
  console.log('Current hand:', hand.map(c => c.id).join(', '))
  
  const court = game.value.getCurrentPlayerCourt()
  console.log('Current court:', court.map(c => c.id).join(', '))
  
  console.log('Power chain status:', game.value.getPowerChainStatus())
}

function makeTestMove() {
  console.log('\n♟️ Testing Chess Move...')
  const success = game.value.makeChessMove('e2', 'e4')
  console.log('Move e2-e4 success:', success)
  updateGameState()
}

function playCard(cardId: string) {
  console.log(`\n🃏 Playing card ${cardId} from hand...`)
  const success = game.value.playCard(cardId, 'e4') // Using e4 as dummy target
  console.log('Card play success:', success)
  updateGameState()
}

function playCardFromCourt(cardId: string) {
  console.log(`\n👑 Playing card ${cardId} from court...`)
  const success = game.value.playCard(cardId, 'e4', true) // true = from court
  console.log('Court card play success:', success)
  updateGameState()
}

function clearConsole() {
  consoleOutput.value = ''
}

onMounted(() => {
  captureConsole()
  console.log('🏰 Royal Gambit Technical Demo initialized!')
  console.log('Click the buttons above to test different features.')
  updateGameState()
})
</script>

<style scoped>
.royal-gambit-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.demo-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-clear {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-secondary {
  background: #2196F3;
  color: white;
}

.btn-clear {
  background: #ff9800;
  color: white;
}

.game-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.current-player h3, .power-chain-status h3, .player-hand h3, .court-cards h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.cards {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card {
  background: white;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  min-width: 40px;
  text-align: center;
  font-weight: bold;
}

.card:hover {
  background: #f0f0f0;
}

.court-card {
  background: #ffe0b3;
}

.chess-board-placeholder {
  margin-bottom: 2rem;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1px;
  max-width: 400px;
  border: 2px solid #333;
}

.square {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.square.light {
  background: #f0d9b5;
}

.square.dark {
  background: #b58863;
}

.console-output {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 1rem;
  background: #f9f9f9;
}

.console-content {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  background: #1e1e1e;
  color: #00ff00;
  padding: 1rem;
  border-radius: 4px;
}
</style>