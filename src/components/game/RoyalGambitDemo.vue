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
  max-width: 1300px;
  margin: 0 auto;
  padding: 1rem;
  background: #2d2d2d;
  color: #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  min-height: 100vh;
}

h1 {
  color: #64b5f6;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.demo-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary, .btn-secondary, .btn-clear {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn-clear {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
}

.btn-clear:hover {
  background: linear-gradient(135deg, #f57c00, #ef6c00);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.game-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.current-player, .power-chain-status, .player-hand, .court-cards {
  background: #3d3d3d;
  border: 2px solid #505050;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.current-player h3, .power-chain-status h3, .player-hand h3, .court-cards h3 {
  margin-bottom: 1rem;
  color: #64b5f6;
  font-size: 1.3rem;
  border-bottom: 2px solid #42a5f5;
  padding-bottom: 0.5rem;
}

.current-player p, .power-chain-status p {
  color: #b0b0b0;
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.cards {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.card {
  background: linear-gradient(135deg, #4a4a4a, #5a5a5a);
  border: 2px solid #42a5f5;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  min-width: 60px;
  text-align: center;
  font-weight: bold;
  color: #e0e0e0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.card:hover {
  background: linear-gradient(135deg, #5a5a5a, #6a6a6a);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  border-color: #29b6f6;
}

.court-card {
  background: linear-gradient(135deg, #6d4c41, #8d6e63);
  border-color: #ffb74d;
  color: #ffffff;
}

.court-card:hover {
  background: linear-gradient(135deg, #8d6e63, #a1887f);
  border-color: #ffa726;
}

.chess-board-placeholder {
  margin-bottom: 2rem;
  background: #3d3d3d;
  border: 2px solid #505050;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow-x: auto;
}

.chess-board-placeholder h3 {
  color: #64b5f6;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #42a5f5;
  padding-bottom: 0.5rem;
}

.chess-board-placeholder p {
  color: #b0b0b0;
  font-family: monospace;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #505050;
  border-radius: 4px;
  word-break: break-all;
  overflow-x: auto;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1px;
  width: 520px;
  max-width: none;
  border: 3px solid #64b5f6;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  margin: 0 auto;
}

.square {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.square.light {
  background: #f0d9b5;
}

.square.dark {
  background: #b58863;
  color: #ffffff;
}

.console-output {
  border: 2px solid #505050;
  border-radius: 8px;
  padding: 1.5rem;
  background: #3d3d3d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.console-output h3 {
  color: #64b5f6;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #42a5f5;
  padding-bottom: 0.5rem;
}

.console-content {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1rem;
  line-height: 1.5;
  background: #263238;
  color: #4fc3f7;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid #37474f;
}

.console-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .royal-gambit-demo {
    padding: 0.5rem;
  }
  
  .game-info {
    grid-template-columns: 1fr;
  }
  
  .board-grid {
    width: 100%;
    max-width: 520px;
  }
  
  .square {
    width: calc((100vw - 3rem) / 8);
    height: calc((100vw - 3rem) / 8);
    max-width: 64px;
    max-height: 64px;
    font-size: 1rem;
  }
}
</style>