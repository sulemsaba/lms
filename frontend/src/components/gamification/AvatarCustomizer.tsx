import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useGamificationStore } from "@/stores/gamificationStore";
import styles from "./AvatarCustomizer.module.css";

const TYPES = [
  { id: 'hat', label: 'Hats', icon: 'face' },
  { id: 'glasses', label: 'Glasses', icon: 'visibility' },
  { id: 'outfit', label: 'Outfits', icon: 'checkroom' },
  { id: 'pet', label: 'Pets', icon: 'pets' },
  { id: 'effect', label: 'Effects', icon: 'auto_awesome' },
] as const;

const XP_PER_LEVEL = 1000;

export default function AvatarCustomizer() {
  const { xp, level, accessories, equippedAccessories, equipAccessory, unequipAccessory } = useGamificationStore();
  const [activeType, setActiveType] = useState<typeof TYPES[number]['id']>('hat');

  const xpInCurrentLevel = xp - (level - 1) * XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL;
  const xpProgress = (xpInCurrentLevel / xpForNextLevel) * 100;

  const filteredAccessories = accessories.filter(a => a.type === activeType);
  const equippedIds = new Set(equippedAccessories);

  const handleToggleEquip = (accessoryId: string) => {
    if (equippedIds.has(accessoryId)) {
      unequipAccessory(accessoryId);
    } else {
      equipAccessory(accessoryId);
    }
  };

  // Get equipped accessories for preview
  const equippedHat = accessories.find(a => a.type === 'hat' && equippedIds.has(a.id));
  const equippedGlasses = accessories.find(a => a.type === 'glasses' && equippedIds.has(a.id));
  const equippedOutfit = accessories.find(a => a.type === 'outfit' && equippedIds.has(a.id));
  const equippedPet = accessories.find(a => a.type === 'pet' && equippedIds.has(a.id));
  const equippedEffect = accessories.find(a => a.type === 'effect' && equippedIds.has(a.id));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="palette" size={24} />
          {' '}Customize Avatar
        </h2>
        <div className={styles.xpDisplay}>
          <Icon name="star" size={16} />
          {xp.toLocaleString()} XP
        </div>
      </div>

      {/* Avatar Preview */}
      <div className={styles.previewSection}>
        <div className={styles.avatarPreview}>
          <div className={styles.avatarEmoji}><Icon name="face" size={48} /></div>
          {equippedEffect && (
            <div className={styles.accessoryEffect}><Icon name={equippedEffect.icon} size={40} /></div>
          )}
          {equippedHat && <span className={`${styles.equippedAccessory} ${styles.accessoryHat}`}><Icon name={equippedHat.icon} size={24} /></span>}
          {equippedGlasses && <span className={`${styles.equippedAccessory} ${styles.accessoryGlasses}`}><Icon name={equippedGlasses.icon} size={20} /></span>}
          {equippedOutfit && <span className={`${styles.equippedAccessory} ${styles.accessoryOutfit}`}><Icon name={equippedOutfit.icon} size={28} /></span>}
          {equippedPet && <span className={`${styles.equippedAccessory} ${styles.accessoryPet}`}><Icon name={equippedPet.icon} size={24} /></span>}
        </div>
        <div className={styles.avatarInfo}>
          <p className={styles.avatarName}>Your Avatar</p>
          <p className={styles.avatarLevel}>Level {level}</p>
          <div className={styles.xpBar}>
            <div className={styles.xpBarFill} style={{ width: `${xpProgress}%` }} />
          </div>
          <p className={styles.xpText}>
            {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP to Level {level + 1}
          </p>
        </div>
      </div>

      {/* Type Tabs */}
      <h3 className={styles.sectionTitle}>Accessories</h3>
      <div className={styles.typeTabs}>
        {TYPES.map((type) => (
          <button
            key={type.id}
            className={`${styles.typeTab} ${activeType === type.id ? styles.active : ''}`}
            onClick={() => setActiveType(type.id)}
          >
            <Icon name={type.icon} size={14} />
            {type.label}
          </button>
        ))}
      </div>

      {/* Accessory Grid */}
      <div className={styles.shopGrid}>
        {filteredAccessories.map((item) => {
          const isEquipped = equippedIds.has(item.id);
          const isUnlocked = item.unlocked;

          return (
            <div
              key={item.id}
              className={`${styles.shopItem} ${isEquipped ? styles.equipped : ''} ${!isUnlocked ? styles.locked : ''}`}
              onClick={() => isUnlocked ? handleToggleEquip(item.id) : undefined}
              title={isUnlocked ? (isEquipped ? 'Click to unequip' : 'Click to equip') : `Requires ${item.xpRequired.toLocaleString()} XP`}
            >
              {isEquipped && (
                <div className={styles.equippedBadge}>
                  <Icon name="check" size={14} />
                </div>
              )}
              {!isUnlocked && (
                <div className={styles.lockIcon}>
                  <Icon name="lock" size={14} />
                </div>
              )}
              <div className={styles.shopItemIcon}>
                <Icon name={item.icon} size={28} />
              </div>
              <div className={styles.shopItemName}>{item.name}</div>
              {!isUnlocked ? (
                <div className={styles.shopItemPrice}>
                  <Icon name="star" size={12} />
                  {item.xpRequired.toLocaleString()}
                </div>
              ) : isEquipped ? (
                <div className={styles.shopItemPrice}>Equipped</div>
              ) : (
                <div className={styles.shopItemPrice}>Owned</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
