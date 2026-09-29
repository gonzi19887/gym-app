import React from 'react';

interface ShenronRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusKi: number;
}

export const ShenronRewardModal: React.FC<ShenronRewardModalProps> = ({ isOpen, onClose, bonusKi }) => {
  if (!isOpen) return null;

  return (
    <div className="shenron-modal-overlay">
      <div className="shenron-modal-content">
        <div className="shenron-dragon-aura">
          <div className="dragon-glow-ring"></div>
          <span className="shenron-emoji">🐉</span>
        </div>

        <h2 className="shenron-title">¡HAS COMPLETADO LAS 7 ESFERAS!</h2>
        <p className="shenron-subtitle">El Dragón Sagrado Shenron concede tu deseo de poder:</p>

        <div className="ki-reward-badge">
          <span className="ki-plus">+</span>
          <span className="ki-amount">{bonusKi}</span>
          <span className="ki-unit">PUNTOS DE KI (XP)</span>
        </div>

        <p className="shenron-wish-text">"¡Tu fuerza ha aumentado y tu racha de entrenamiento se consolida en la Cámara del Tiempo!"</p>

        <button className="shenron-claim-btn" onClick={onClose}>
          ⚡ ACEPTAR PODER Y CONTINUAR
        </button>
      </div>
    </div>
  );
};
