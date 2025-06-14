#!/usr/bin/env node

import readline from 'readline';
import { GameController } from './services/GameController';

// Override the getPlayerInput method to use readline
class CLIGameController extends GameController {
  private rl: readline.Interface;

  constructor() {
    super();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  protected async getPlayerInput(prompt: string = '> '): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async cleanup(): Promise<void> {
    this.rl.close();
  }
}

async function main() {
  const controller = new CLIGameController();
  
  try {
    await controller.startGame();
  } catch (error) {
    console.error('Game error:', error);
  } finally {
    await controller.cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nThanks for playing Heart of Five!');
  process.exit(0);
});

process.on('exit', () => {
  console.log('Goodbye!');
});

if (require.main === module) {
  main().catch(console.error);
}

export { CLIGameController };