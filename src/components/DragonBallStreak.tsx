import React from 'react';

interface DragonBallStreakProps {
  completedDays: number; // 0 to 7
  onCompleteStreak?: () => void;
}

export const DragonBallStreak: React.FC<DragonBallStreakProps> = ({ completedDays, onCompleteStreak }) => {
  const days = [
    { label: 'LUN', stars: 1 },
    { label: 'MAR', stars: 2 },
    { label: 'MIÉ', stars: 3 },
    { label: 'JUE', stars: 4 },
    { label: 'VIE', stars: 5 },
    { label: 'SÁB', stars: 6 },
    { label: 'DOM', stars: 7 },
  ];

  return (
    <div className="dragon-ball-streak-card">
      <div className="streak-header">
        <h3>🐉 RACHA SEMANAL — 7 ESFERAS DEL DRAGÓN</h3>
        <span className="streak-badge">{completedDays}/7 DÍAS</span>
      </div>

      <div className="db-grid">
        {days.map((day, idx) => {
          const isActive = idx < completedDays;
          return (
            <div key={idx} className="db-item">
              <div className={`live-dragon-ball ${isActive ? 'active' : 'inactive'}`}>
                <div className="live-star-container">
                  {day.stars === 1 && <div className="live-star star-center">★</div>}

                  {day.stars === 2 && (
                    <>
                      <div className="live-star star-2-1">★</div>
                      <div className="live-star star-2-2">★</div>
                    </>
                  )}

                  {day.stars === 3 && (
                    <>
                      <div className="live-star star-3-1">★</div>
                      <div className="live-star star-3-2">★</div>
                      <div className="live-star star-3-3">★</div>
                    </>
                  )}

                  {day.stars === 4 && (
                    <>
                      <div className="live-star ls1">★</div>
                      <div className="live-star ls2">★</div>
                      <div className="live-star ls3">★</div>
                      <div className="live-star ls4">★</div>
                    </>
                  )}

                  {day.stars === 5 && (
                    <>
                      <div className="live-star star-5-1">★</div>
                      <div className="live-star star-5-2">★</div>
                      <div className="live-star star-5-3">★</div>
                      <div className="live-star star-5-4">★</div>
                      <div className="live-star star-5-5">★</div>
                    </>
                  )}

                  {day.stars === 6 && (
                    <>
                      <div className="live-star star-6-1">★</div>
                      <div className="live-star star-6-2">★</div>
                      <div className="live-star star-6-3">★</div>
                      <div className="live-star star-6-4">★</div>
                      <div className="live-star star-6-5">★</div>
                      <div className="live-star star-6-6">★</div>
                    </>
                  )}

                  {day.stars === 7 && (
                    <>
                      <div className="live-star star-7-1">★</div>
                      <div className="live-star star-7-2">★</div>
                      <div className="live-star star-7-3">★</div>
                      <div className="live-star star-7-4">★</div>
                      <div className="live-star star-7-5">★</div>
                      <div className="live-star star-7-6">★</div>
                      <div className="live-star star-7-7">★</div>
                    </>
                  )}
                </div>
              </div>
              <span className={`day-label ${isActive ? 'active-label' : ''}`}>{day.label}</span>
            </div>
          );
        })}
      </div>

      <p className="streak-footer">
        {completedDays === 7 ? (
          <button className="claim-reward-btn" onClick={onCompleteStreak}>
            ✨ INVOCAR A SHENRON Y RECLAMAR KI BONUS
          </button>
        ) : (
          `Entrena ${7 - completedDays} días más para invocar a Shenron y ganar el bonus semanal de Ki.`
        )}
      </p>
    </div>
  );
};
