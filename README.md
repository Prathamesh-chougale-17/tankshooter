# Tank Shooter - Gorbagana Testnet Multiplayer Game

🎮 **Multiplayer Tank Battle Arena on Gorbagana Blockchain**

A fast-paced, competitive multiplayer tank game built specifically for the Gorbagana testnet, demonstrating the network's speed and fairness through real-time gameplay and blockchain integration.

## 🎯 Game Overview

Tank Shooter is an engaging multiplayer mini-game where players:

- Choose from 4 different tank classes (Basic, Twin, Sniper, Machine Gun)
- Battle in multiple game modes (Free For All, Team Deathmatch, Domination)
- Pay gas fees in $GOR tokens to enter matches
- Experience sub-second transaction finality for smooth gameplay

## 🌐 Gorbagana Integration

### Wallet Connection

- **Required Wallet**: Backpack Wallet (primary supported wallet)
- **Network**: Gorbagana Testnet (`https://rpc.gorbagana.wtf/`)
- **Gas Token**: $GOR

### Blockchain Features

- **Entry Fee**: 0.0001 $GOR per game session
- **Real-time Transactions**: Leverages Gorbagana's sub-second finality
- **Fair Play**: Blockchain-verified game entry and payment processing
- **Transparent Economy**: All transactions visible on Gorbagana explorer

## 🚀 Quick Start

### Prerequisites

1. Install [Backpack Wallet](https://backpack.app/)
2. Configure custom RPC to `https://rpc.gorbagana.wtf/`
3. Get test $GOR tokens from [Gorbagana Telegram](https://t.me/+lw2vDTWJeacxMDhh)

### Playing the Game

1. Connect your Backpack wallet to the game
2. Enter your player name

### Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the game locally.

## 🏗 Technical Architecture

### Frontend Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI with custom tank-themed design
- **Wallet Integration**: @wallet-ui/react for Backpack support

### Blockchain Integration

- **Network**: Gorbagana Testnet (Solana fork)
- **RPC**: `https://rpc.gorbagana.wtf/`
- **Gas Payment**: Custom transaction handling for $GOR fees
- **Wallet**: Backpack wallet integration with custom RPC configuration

### Game Features

- **Tank Classes**: 4 unique classes with different abilities
- **Game Modes**: Multiple competitive formats
- **Real-time Multiplayer**: WebSocket-based gameplay
- **Blockchain Verification**: Entry fee payment before gameplay

## 🎮 Game Mechanics

### Tank Classes

1. **Basic Tank**: Balanced stats, perfect for beginners
2. **Twin**: Dual cannons with faster fire rate
3. **Sniper**: Long-range precision with high damage
4. **Machine Gun**: Rapid fire with lower damage per shot

### Game Modes

1. **Free For All**: Every tank for themselves
2. **Team Deathmatch**: 2 teams battle for supremacy
3. **Domination**: Control key points on the map

## 🏆 Gorbagana Bounty Submission

This project is submitted for the **Gorbagana Testnet Bounty Program** with focus on:

### Gameplay & Fun (40 points)

- Fast-paced, competitive multiplayer action
- Multiple tank classes and game modes for variety
- Smooth, responsive controls and animations
- Replayable with different strategies per tank class

### Testnet Integration (30 points)

- Native $GOR token usage for game entry fees
- Custom RPC integration with Gorbagana testnet
- Backpack wallet requirement demonstrating ecosystem adoption
- Real-time blockchain transaction processing

### User Attraction (20 points)

- Beautiful, modern UI with tank-themed animations
- Easy onboarding process with clear wallet instructions
- Competitive gameplay that encourages return visits
- Social sharing features for match results

### Social Promotion (10 points)

- Submission tweet with required hashtags and mentions
- Community-friendly design encouraging sharing
- Documentation for easy setup and contribution

## 📱 Social Media Template

Ready to tweet? Use this template:

```
🎮 Just built Tank Shooter - a multiplayer tank battle game on @Gorbagana_chain testnet! 

🔥 Features:
- Real-time multiplayer battles
- $GOR token integration  
- 4 tank classes & multiple game modes
- Sub-second blockchain transactions

Try it now! 🚀

#GorbaganaTestnet @sarv_shaktimaan @lex_node

```

**Built with 💜 for the Gorbagana community**

*Embracing the "trash chain" philosophy with serious gaming infrastructure*
