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
                20: { type: 'trail_effect', id: 'basic_snow_trail' },
                25: { type: 'coins', amount: 300 },
                30: { type: 'trick_animation', id: 'basic_flip' },
                // ... more free rewards
            },
            premium: {
                1: { type: 'character', id: 'pro_skier', stats: { speed: 1.2, control: 1.1 } },
                5: { type: 'skis', id: 'golden_skis', stats: { speed: 1.3, control: 1.2 } },
                10: { type: 'trail_effect', id: 'rainbow_trail' },
                15: { type: 'trick_animation', id: 'backflip_twist' },
                20: { type: 'character', id: 'elite_snowboarder', stats: { speed: 1.4, control: 1.3 } },
                25: { type: 'trail_effect', id: 'fire_trail' },
                30: { type: 'trick_animation', id: 'triple_cork' },
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

    upgradeToPremium() {
        this.isPremium = true;
        this.saveProgress();
        this.updateUI();

        // Check for unclaimed premium rewards at current and previous tiers
        for (let tier = 1; tier <= this.currentTier; tier++) {
            if (this.rewards.premium[tier] && !this.claimedRewards[`premium_${tier}`]) {
                this.showRewardNotification(this.rewards.premium[tier], 'premium');
            }
        }
    }

    addXP(amount) {
        this.currentXP += amount;
        
        // Check for tier ups
        while (this.currentXP >= this.getRequiredXP(this.currentTier) && this.currentTier < this.maxTier) {
            this.currentXP -= this.getRequiredXP(this.currentTier);
            this.currentTier++;
            this.onTierUp();
        }
        
        // Cap XP at max for current tier
        if (this.currentTier === this.maxTier) {
            this.currentXP = Math.min(this.currentXP, this.getRequiredXP(this.currentTier));
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

        // Remove the notification after claiming
        const notification = document.querySelector('.battle-pass-notification');
        if (notification) {
            notification.remove();
        }
    }

    unlockCharacter(id, stats) {
        // Implementation for unlocking characters
        console.log(`Unlocked character: ${id}`);
        // Add character to player's inventory
    }

    unlockTrailEffect(id) {
        // Implementation for unlocking trail effects
        console.log(`Unlocked trail effect: ${id}`);
        // Add trail effect to player's inventory
    }

    unlockTrickAnimation(id) {
        // Implementation for unlocking trick animations
        console.log(`Unlocked trick animation: ${id}`);
        // Add trick animation to player's inventory
    }

    saveProgress() {
        this.userBattlePassRef.set({
            currentTier: this.currentTier,
            currentXP: Math.round(this.currentXP),
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
            <button onclick="gameManager.battlePass.claimReward(${this.currentTier}, '${type}')">
                Claim Reward
            </button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
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
        // Update both menu and in-game battle pass displays
        const progressElements = document.querySelectorAll('#battle-pass-progress');
        progressElements.forEach(progressElement => {
            if (progressElement) {
                const progress = (this.currentXP / this.getRequiredXP(this.currentTier)) * 100;
                progressElement.style.width = `${progress}%`;
            }
        });

        const tierElements = document.querySelectorAll('#current-tier');
        tierElements.forEach(element => {
            if (element) {
                element.textContent = `Tier ${this.currentTier}`;
            }
        });

        const xpElements = document.querySelectorAll('#current-xp');
        xpElements.forEach(element => {
            if (element) {
                const roundedCurrentXP = Math.round(this.currentXP);
                const roundedRequiredXP = Math.round(this.getRequiredXP(this.currentTier));
                element.textContent = `${roundedCurrentXP}/${roundedRequiredXP} XP`;
            }
        });

        // Update pass type displays
        const passTypeElements = document.querySelectorAll('.pass-type');
        passTypeElements.forEach(element => {
            if (element) {
                element.textContent = this.isPremium ? 'PREMIUM PASS' : 'FREE PASS';
            }
        });
    }
}