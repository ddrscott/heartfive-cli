import { GameStateManager } from '../services/GameState';
import { CardModel } from '../models/Card';
import { MeldDetector } from '../models/Meld';

describe('GameStateManager', () => {
  let gameState: GameStateManager;

  beforeEach(() => {
    gameState = new GameStateManager(4);
  });

  describe('initialization', () => {
    it('should create a game with 4 players', () => {
      const state = gameState.getState();
      expect(state.players.length).toBe(4);
      expect(state.players[0].id).toBe('human');
      expect(state.players[0].isBot).toBe(false);
      expect(state.players[1].isBot).toBe(true);
    });

    it('should start at round 1', () => {
      const state = gameState.getState();
      expect(state.round).toBe(1);
      expect(state.playHistory).toEqual([]);
    });
  });

  describe('round management', () => {
    it('should deal cards when starting a new round', () => {
      gameState.startNewRound();
      const state = gameState.getState();
      
      // Each player should have cards
      state.players.forEach(player => {
        expect(player.hand.length).toBeGreaterThan(0);
      });

      // Total cards should equal deck size
      const totalCards = state.players.reduce((sum, p) => sum + p.hand.length, 0);
      expect(totalCards).toBe(54); // 52 + 2 jokers
    });

    it('should find starting player with 3H', () => {
      gameState.startNewRound();
      const state = gameState.getState();
      const currentPlayer = state.players[state.currentPlayerIndex];
      
      // Current player should have 3H
      const has3H = currentPlayer.hand.some(card => card.notation === '3H');
      expect(has3H).toBe(true);
      expect(state.currentLeader).toBe(currentPlayer.id);
    });
  });

  describe('play validation', () => {
    it('should allow any meld from leader when no established type', () => {
      gameState.startNewRound();
      const leader = gameState.getCurrentPlayer();
      
      // Create a single card meld
      const card = leader.hand[0];
      const meld = MeldDetector.createMeld([card])!;
      
      expect(gameState.isLegalPlay(meld)).toBe(true);
    });

    it('should enforce meld type matching after first play', () => {
      gameState.startNewRound();
      const player = gameState.getCurrentPlayer();
      
      // Play a pair
      const pairs = findPairs(player.hand);
      if (pairs.length > 0) {
        const pairMeld = MeldDetector.createMeld(pairs[0])!;
        gameState.playMeld(player, pairMeld);
        
        // Next player must play a pair or bomb
        gameState.nextTurn();
        const nextPlayer = gameState.getCurrentPlayer();
        
        // Single card should not be legal
        const singleMeld = MeldDetector.createMeld([nextPlayer.hand[0]])!;
        expect(gameState.isLegalPlay(singleMeld)).toBe(false);
      }
    });

    it('should allow bombs to break type restrictions', () => {
      gameState.startNewRound();
      const player = gameState.getCurrentPlayer();
      
      // Manually set up a scenario with established single
      const singleMeld = MeldDetector.createMeld([player.hand[0]])!;
      gameState.playMeld(player, singleMeld);
      
      // Create a fake four of a kind bomb
      const bombCards = [
        CardModel.fromNotation('3H'),
        CardModel.fromNotation('3D'),
        CardModel.fromNotation('3C'),
        CardModel.fromNotation('3S')
      ];
      const bomb = MeldDetector.createMeld(bombCards)!;
      
      expect(bomb.type).toBe('fourOfKindBomb');
      expect(gameState.isLegalPlay(bomb)).toBe(true);
    });
  });

  describe('turn management', () => {
    it('should handle passing correctly', () => {
      gameState.startNewRound();
      const initialLeader = gameState.getState().currentLeader;
      const leader = gameState.getCurrentPlayer();
      
      // Leader plays a card first
      const meld = MeldDetector.createMeld([leader.hand[0]])!;
      gameState.playMeld(leader, meld);
      
      // Have all other players pass
      for (let i = 0; i < 3; i++) {
        gameState.nextTurn();
        gameState.pass(gameState.getCurrentPlayer());
      }
      
      const state = gameState.getState();
      expect(state.consecutivePasses).toBe(0); // Should reset after everyone passes
      expect(state.currentLeader).toBe(initialLeader); // Leader should stay the same
      expect(state.establishedMeldType).toBeUndefined(); // Should reset for new trick
    });
  });

  describe('round end detection', () => {
    it('should detect winner when player has no cards', () => {
      gameState.startNewRound();
      const player = gameState.getCurrentPlayer();
      
      // Remove all cards from player's hand
      player.hand = [];
      
      const winner = gameState.checkRoundEnd();
      expect(winner).toBe(player);
      expect(player.wins).toBe(1);
    });
  });
});

// Helper function to find pairs in a hand
function findPairs(hand: any[]): any[][] {
  const pairs: any[][] = [];
  const rankGroups: Record<string, any[]> = {};
  
  hand.forEach(card => {
    if (!card.isJoker) {
      if (!rankGroups[card.rank]) {
        rankGroups[card.rank] = [];
      }
      rankGroups[card.rank].push(card);
    }
  });
  
  Object.values(rankGroups).forEach(cards => {
    if (cards.length >= 2) {
      pairs.push([cards[0], cards[1]]);
    }
  });
  
  return pairs;
}