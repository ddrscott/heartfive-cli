import { BeginnerBot, IntermediateBot, AdvancedBot, BotManager } from '../ai/BotStrategy';
import { GameStateManager } from '../services/GameState';
import { PlayerModel } from '../models/Player';
import { CardModel } from '../models/Card';
import { MeldDetector } from '../models/Meld';

describe('BotStrategy', () => {
  let gameState: GameStateManager;
  let bot: any;
  let player: PlayerModel;

  beforeEach(() => {
    gameState = new GameStateManager(4);
    gameState.startNewRound();
    player = PlayerModel.createBotPlayer('test', 'Test Bot');
    
    // Give player some test cards
    player.addCards([
      CardModel.fromNotation('3H'),
      CardModel.fromNotation('4H'),
      CardModel.fromNotation('5H'),
      CardModel.fromNotation('KS'),
      CardModel.fromNotation('AD')
    ]);
  });

  describe('BeginnerBot', () => {
    beforeEach(() => {
      bot = new BeginnerBot();
    });

    it('should make a decision', () => {
      const legalMoves = gameState.getLegalMoves(player);
      const decision = bot.makeDecision(player, gameState.getState(), legalMoves);
      
      expect(decision.action).toBeDefined();
      expect(['play', 'pass']).toContain(decision.action);
    });

    it('should pass when no legal moves', () => {
      const decision = bot.makeDecision(player, gameState.getState(), []);
      expect(decision.action).toBe('pass');
    });
  });

  describe('IntermediateBot', () => {
    beforeEach(() => {
      bot = new IntermediateBot();
    });

    it('should prefer weaker moves when leading', () => {
      // Make player the leader
      const state = gameState.getState();
      state.currentLeader = player.id;
      
      const legalMoves = [
        MeldDetector.createMeld([CardModel.fromNotation('3H')])!,
        MeldDetector.createMeld([CardModel.fromNotation('KS')])!
      ];
      
      const decision = bot.makeDecision(player, state, legalMoves);
      
      if (decision.action === 'play') {
        // Should prefer the weaker 3H over KS
        expect(decision.meld?.cards[0].notation).toBe('3H');
      }
    });
  });

  describe('AdvancedBot', () => {
    beforeEach(() => {
      bot = new AdvancedBot();
    });

    it('should make strategic decisions', () => {
      const legalMoves = gameState.getLegalMoves(player);
      const decision = bot.makeDecision(player, gameState.getState(), legalMoves);
      
      expect(decision.action).toBeDefined();
      // Advanced bot should never make random invalid decisions
      if (decision.action === 'play') {
        expect(decision.meld).toBeDefined();
        expect(legalMoves).toContainEqual(decision.meld);
      }
    });
  });

  describe('BotManager', () => {
    it('should create bots of different difficulties', () => {
      const beginner = BotManager.createBot('beginner');
      const intermediate = BotManager.createBot('intermediate');
      const advanced = BotManager.createBot('advanced');
      
      expect(beginner).toBeInstanceOf(BeginnerBot);
      expect(intermediate).toBeInstanceOf(IntermediateBot);
      expect(advanced).toBeInstanceOf(AdvancedBot);
    });
  });
});