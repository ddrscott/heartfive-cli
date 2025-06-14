import { ConfigManager } from '../config/ConfigManager';

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.resetToDefaults();
  });

  describe('configuration management', () => {
    it('should return default configuration', () => {
      const config = ConfigManager.getConfig();
      expect(config.gameInfo.name).toBe('Heart of Five');
      expect(config.gameplay.roundsToWin).toBe(10);
      expect(config.gameplay.botDifficulties).toEqual(['intermediate', 'intermediate', 'advanced']);
    });

    it('should update configuration', () => {
      ConfigManager.updateConfig({
        gameplay: {
          roundsToWin: 5,
          botDifficulties: ['beginner', 'beginner', 'intermediate'],
          botNames: ['Alice', 'Bob', 'Cat'],
          autoPassOnNoMoves: true,
          thinkingDelay: { min: 1000, max: 2000 }
        }
      });

      expect(ConfigManager.getRoundsToWin()).toBe(5);
      expect(ConfigManager.getBotDifficulties()).toEqual(['beginner', 'beginner', 'intermediate']);
    });

    it('should merge configurations properly', () => {
      ConfigManager.updateConfig({
        gameplay: {
          roundsToWin: 15,
          botDifficulties: ['beginner', 'beginner', 'intermediate'],
          botNames: ['Alice', 'Bob', 'Cat'],
          autoPassOnNoMoves: true,
          thinkingDelay: { min: 1000, max: 2000 }
        }
      });

      // Other settings should remain unchanged
      const config = ConfigManager.getConfig();
      expect(config.gameInfo.name).toBe('Heart of Five');
      expect(config.gameplay.roundsToWin).toBe(15);
    });
  });

  describe('getters', () => {
    it('should provide convenient getters', () => {
      expect(ConfigManager.getRoundsToWin()).toBe(10);
      expect(ConfigManager.getBotNames()).toEqual(['Alice', 'Bob', 'Cat']);
      expect(ConfigManager.getThinkingDelay()).toEqual({ min: 1000, max: 2000 });
      expect(ConfigManager.shouldShowCardColors()).toBe(true);
      expect(ConfigManager.getMaxHistoryEntries()).toBe(5);
    });

    it('should return copies to prevent mutation', () => {
      const difficulties = ConfigManager.getBotDifficulties();
      difficulties.push('test');
      
      // Original should be unchanged
      expect(ConfigManager.getBotDifficulties()).toEqual(['intermediate', 'intermediate', 'advanced']);
    });
  });

  describe('validation', () => {
    it('should validate configuration values', () => {
      const validConfig = {
        gameplay: {
          roundsToWin: 5,
          botDifficulties: ['beginner', 'intermediate'],
          thinkingDelay: { min: 500, max: 1000 },
          botNames: ['Alice', 'Bob', 'Cat'],
          autoPassOnNoMoves: true
        }
      };

      const errors = ConfigManager.validateConfig(validConfig);
      expect(errors).toEqual([]);
    });

    it('should catch validation errors', () => {
      const invalidConfig = {
        gameplay: {
          roundsToWin: 150, // Too high
          botDifficulties: ['invalid'],
          thinkingDelay: { min: 1000, max: 500 }, // min > max
          botNames: ['Alice', 'Bob', 'Cat'],
          autoPassOnNoMoves: true
        }
      };

      const errors = ConfigManager.validateConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Rounds to win'))).toBe(true);
      expect(errors.some(e => e.includes('Invalid bot difficulty'))).toBe(true);
      expect(errors.some(e => e.includes('Thinking delay'))).toBe(true);
    });
  });

  describe('preset configurations', () => {
    it('should create speed game config', () => {
      const speedConfig = ConfigManager.createSpeedGameConfig();
      expect(speedConfig.gameplay.roundsToWin).toBe(3);
      expect(speedConfig.gameplay.thinkingDelay.max).toBeLessThan(1000);
    });

    it('should create tournament config', () => {
      const tournamentConfig = ConfigManager.createTournamentConfig();
      expect(tournamentConfig.gameplay.roundsToWin).toBe(15);
      expect(tournamentConfig.gameplay.botDifficulties.every(d => d === 'advanced')).toBe(true);
    });

    it('should create beginner config', () => {
      const beginnerConfig = ConfigManager.createBeginnerConfig();
      expect(beginnerConfig.gameplay.roundsToWin).toBe(5);
      expect(beginnerConfig.gameplay.botDifficulties).toEqual(['beginner', 'beginner', 'intermediate']);
    });
  });
});