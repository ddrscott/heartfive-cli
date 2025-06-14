import { GameConfig } from '../types';
import defaultConfig from './default.json';

export interface ExtendedGameConfig extends GameConfig {
  gameplay: {
    roundsToWin: number;
    botDifficulties: string[];
    botNames: string[];
    autoPassOnNoMoves: boolean;
    thinkingDelay: {
      min: number;
      max: number;
    };
  };
  display: {
    showCardColors: boolean;
    showMeldTypes: boolean;
    maxHistoryEntries: number;
    clearScreenOnUpdate: boolean;
  };
}

export class ConfigManager {
  private static config: ExtendedGameConfig = defaultConfig as ExtendedGameConfig;

  static getConfig(): ExtendedGameConfig {
    return { ...this.config };
  }

  static updateConfig(updates: Partial<ExtendedGameConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  static loadFromFile(filePath: string): void {
    try {
      const fs = require('fs');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const userConfig = JSON.parse(fileContent);
      this.config = this.mergeConfig(defaultConfig as ExtendedGameConfig, userConfig);
    } catch (error) {
      console.warn(`Could not load config from ${filePath}, using defaults:`, (error as Error).message);
    }
  }

  static saveToFile(filePath: string): void {
    try {
      const fs = require('fs');
      fs.writeFileSync(filePath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error(`Could not save config to ${filePath}:`, (error as Error).message);
    }
  }

  static resetToDefaults(): void {
    this.config = defaultConfig as ExtendedGameConfig;
  }

  // Specific getters for common config values
  static getRoundsToWin(): number {
    return this.config.gameplay.roundsToWin;
  }

  static getBotDifficulties(): string[] {
    return [...this.config.gameplay.botDifficulties];
  }

  static getBotNames(): string[] {
    return [...this.config.gameplay.botNames];
  }

  static getThinkingDelay(): { min: number; max: number } {
    return { ...this.config.gameplay.thinkingDelay };
  }

  static shouldShowCardColors(): boolean {
    return this.config.display.showCardColors;
  }

  static shouldShowMeldTypes(): boolean {
    return this.config.display.showMeldTypes;
  }

  static getMaxHistoryEntries(): number {
    return this.config.display.maxHistoryEntries;
  }

  static shouldClearScreenOnUpdate(): boolean {
    return this.config.display.clearScreenOnUpdate;
  }

  static getSpecialCards() {
    return { ...this.config.specialCards };
  }

  static getCardRanking() {
    return {
      singleRanks: [...this.config.cardRanking.singleRanks],
      runRanks: [...this.config.cardRanking.runRanks],
      suits: [...this.config.cardRanking.suits]
    };
  }

  private static mergeConfig(base: ExtendedGameConfig, update: any): ExtendedGameConfig {
    const result = { ...base };
    
    for (const key in update) {
      if (update[key] && typeof update[key] === 'object' && !Array.isArray(update[key])) {
        result[key as keyof ExtendedGameConfig] = {
          ...(result[key as keyof ExtendedGameConfig] as any),
          ...update[key]
        };
      } else {
        result[key as keyof ExtendedGameConfig] = update[key];
      }
    }
    
    return result;
  }

  // Validation methods
  static validateConfig(config: Partial<ExtendedGameConfig>): string[] {
    const errors: string[] = [];

    if (config.gameplay?.roundsToWin !== undefined) {
      if (config.gameplay.roundsToWin < 1 || config.gameplay.roundsToWin > 100) {
        errors.push('Rounds to win must be between 1 and 100');
      }
    }

    if (config.gameplay?.botDifficulties) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      for (const difficulty of config.gameplay.botDifficulties) {
        if (!validDifficulties.includes(difficulty)) {
          errors.push(`Invalid bot difficulty: ${difficulty}`);
        }
      }
    }

    if (config.gameplay?.thinkingDelay) {
      const { min, max } = config.gameplay.thinkingDelay;
      if (min < 0 || max < 0 || min > max) {
        errors.push('Thinking delay values must be positive and min <= max');
      }
    }

    return errors;
  }

  // Create variant configurations
  static createSpeedGameConfig(): ExtendedGameConfig {
    const config = this.getConfig();
    config.gameplay.roundsToWin = 3;
    config.gameplay.thinkingDelay = { min: 200, max: 500 };
    return config;
  }

  static createTournamentConfig(): ExtendedGameConfig {
    const config = this.getConfig();
    config.gameplay.roundsToWin = 15;
    config.gameplay.botDifficulties = ['advanced', 'advanced', 'advanced'];
    return config;
  }

  static createBeginnerConfig(): ExtendedGameConfig {
    const config = this.getConfig();
    config.gameplay.roundsToWin = 5;
    config.gameplay.botDifficulties = ['beginner', 'beginner', 'intermediate'];
    config.gameplay.thinkingDelay = { min: 1500, max: 3000 };
    return config;
  }
}