// BattlePass.js
import * as THREE from 'three';

export class BattlePass {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentTier = 1;
        this.maxTier = 100;
        this.currentXP = 0;
        this.isPremium = false;
        
        // XP required for each tier increases progressively
        this.getRequiredXP = (tier) => {
            return 1000 * Math.pow(1.05, tier - 1);
        };

        // Define seasonal rewards
        this.rewards = {
            free: {
                1: { type: 'coins', amount: 100 },
                5: { type: 'skis', id: 'basic_red_skis', stats: { speed: 1.1, control: 1.0 } },
                10: { type: 'coins', amount: 200 },
                15: { type: 'character', id: 'basic_snowboarder' },
                // ... more free rewards
            },
            premium: {
                1: { type: 'character', id: 'pro_skier', stats: { speed: 1.2, control: 1.1 } },
                5: { type: 'skis', id: 'golden_skis', stats: { speed: 1.3, control: 1.2 } },
                10: { type: 'trail_effect', id: 'rainbow_trail' },
                15: { type: 'trick_animation', id: 'backflip_twist' },
                // ... more premium rewards
            }
        };

        // Initialize Firebase references
        this.userBattlePassRef = firebase.database().ref(`battlePass/${this.gameManager.username}`);
        this.loadUserProgress();
    }

    loadUserProgress() {
        this.userBattlePassRef.once('value', (snapshot) => {
            const data = snapshot.val() || {};
            this.currentTier = data.currentTier || 1;
            this.currentXP = data.currentXP || 0;
            this.isPremium = data.isPremium || false;
            this.claimedRewards = data.claimedRewards || {};
            this.updateUI();
        });
    }

    addXP(amount) {
        this.currentXP += amount;
        while (this.currentXP >= this.getRequiredXP(this.currentTier) && this.currentTier < this.maxTier) {
            this.currentXP -= this.getRequiredXP(this.currentTier);
            this.currentTier++;
            this.onTierUp();
        }
        this.saveProgress();
        this.updateUI();
    }

    onTierUp() {
        // Check for available rewards
        const freeReward = this.rewards.free[this.currentTier];
        const premiumReward = this.isPremium ? this.rewards.premium[this.currentTier] : null;

        if (freeReward && !this.claimedRewards[`free_${this.currentTier}`]) {
            this.showRewardNotification(freeReward, 'free');
        }

        if (premiumReward && !this.claimedRewards[`premium_${this.currentTier}`]) {
            this.showRewardNotification(premiumReward, 'premium');
        }
    }

    claimReward(tier, type) {
        const rewardKey = `${type}_${tier}`;
        if (this.claimedRewards[rewardKey]) return;

        const reward = this.rewards[type][tier];
        if (!reward) return;

        // Apply reward based on type
        switch (reward.type) {
            case 'coins':
                this.gameManager.coins += reward.amount;
                break;
            case 'skis':
                this.gameManager.skiEquipmentManager.unlockSkis(reward.id, reward.stats);
                break;
            case 'character':
                this.unlockCharacter(reward.id, reward.stats);
                break;
            case 'trail_effect':
                this.unlockTrailEffect(reward.id);
                break;
            case 'trick_animation':
                this.unlockTrickAnimation(reward.id);
                break;
        }

        this.claimedRewards[rewardKey] = true;
        this.saveProgress();
        this.updateUI();
    }

    saveProgress() {
        this.userBattlePassRef.set({
            currentTier: this.currentTier,
            currentXP: this.currentXP,
            isPremium: this.isPremium,
            claimedRewards: this.claimedRewards
        });
    }

    showRewardNotification(reward, type) {
        const notification = document.createElement('div');
        notification.className = 'battle-pass-notification';
        notification.innerHTML = `
            <h3>New ${type === 'premium' ? 'Premium' : 'Free'} Reward Unlocked!</h3>
            <p>${this.getRewardDescription(reward)}</p>
            <button onclick="gameManger.battlePass.claimReward(${this.currentTier}, '${type}')">
                Claim Reward
            </button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    getRewardDescription(reward) {
        switch (reward.type) {
            case 'coins':
                return `${reward.amount} Coins`;
            case 'skis':
                return `New Skis: ${reward.id.replace(/_/g, ' ')}`;
            case 'character':
                return `New Character: ${reward.id.replace(/_/g, ' ')}`;
            case 'trail_effect':
                return `New Trail Effect: ${reward.id.replace(/_/g, ' ')}`;
            case 'trick_animation':
                return `New Trick Animation: ${reward.id.replace(/_/g, ' ')}`;
            default:
                return 'Mystery Reward';
        }
    }

    updateUI() {
        // Update battle pass UI elements
        const progressElement = document.getElementById('battle-pass-progress');
        if (progressElement) {
            const progress = (this.currentXP / this.getRequiredXP(this.currentTier)) * 100;
            progressElement.style.width = `${progress}%`;
        }

        document.getElementById('current-tier').textContent = `Tier ${this.currentTier}`;
        document.getElementById('current-xp').textContent = 
            `${this.currentXP}/${this.getRequiredXP(this.currentTier)} XP`;
    }
}