import React, { useState, useMemo } from 'react';
import type { Routine, RoutineExercise, Exercise, Workout, WorkoutSet } from '../db/localDb';

interface CalendarKiProps {
  routines: Routine[];
  routineExercises: RoutineExercise[];
  exercises: Exercise[];
  workouts: Workout[];
  workoutSets: WorkoutSet[];
  
  onStartWorkout: (routine: Routine) => void;
  onOpenRoutineCreator: (dayValue?: number) => void;
  onClaimShenron: () => void;
  theme: 'dark' | 'light';
}

const StarSvg: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ 
  size = 10, 
  className = "fill-current text-red-600",
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className} 
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
  >
    <path d="M12 2l2.9 6.6L22 9.5l-5.3 4.8 1.5 7.1-6.2-3.6-6.2 3.6 1.5-7.1L2 9.5l7.1-.9L12 2z" />
  </svg>
);

export const DragonBallIcon: React.FC<{ stars: number; size?: number; inactive?: boolean }> = ({ 
  stars, 
  size = 36, 
  inactive = false 
}) => {
  if (inactive) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-elevated, #24293a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.45,
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))'
        }}
      >
        <span style={{ fontSize: size * 0.4, color: 'var(--text-tertiary, #6b7280)' }}>â˜…</span>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #ffbe3b 0%, #e67e00 100%)',
        boxShadow: '0 2px 8px rgba(230, 126, 0, 0.45), inset -2px -2px 4px rgba(0,0,0,0.2)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {stars === 1 && (
        <StarSvg size={size * 0.42} className="text-[#aa3015] drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
      )}

      {stars === 2 && (
        <div style={{ display: 'flex', gap: '2px' }}>
          <StarSvg size={size * 0.28} className="text-[#aa3015]" />
          <StarSvg size={size * 0.28} className="text-[#aa3015]" />
        </div>
      )}

      {stars === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-2px' }}>
          <StarSvg size={size * 0.24} className="text-[#aa3015]" />
          <div style={{ display: 'flex', gap: '3px', marginTop: '1px' }}>
            <StarSvg size={size * 0.24} className="text-[#aa3015]" />
            <StarSvg size={size * 0.24} className="text-[#aa3015]" />
          </div>
        </div>
      )}

      {stars === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          <StarSvg size={size * 0.22} className="text-[#aa3015]" />
          <StarSvg size={size * 0.22} className="text-[#aa3015]" />
          <StarSvg size={size * 0.22} className="text-[#aa3015]" />
          <StarSvg size={size * 0.22} className="text-[#aa3015]" />
        </div>
      )}

      {stars === 5 && (
        <div style={{ position: 'relative', width: size * 0.65, height: size * 0.65 }}>
          <div style={{ position: 'absolute', top: 0, left: 0 }}><StarSvg size={size * 0.2} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', top: 0, right: 0 }}><StarSvg size={size * 0.2} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <StarSvg size={size * 0.22} className="text-[#aa3015]" />
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0 }}><StarSvg size={size * 0.2} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}><StarSvg size={size * 0.2} className="text-[#aa3015]" /></div>
        </div>
      )}

      {stars === 6 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', padding: '1px' }}>
          <StarSvg size={size * 0.18} className="text-[#aa3015]" />
          <StarSvg size={size * 0.18} className="text-[#aa3015]" />
          <StarSvg size={size * 0.18} className="text-[#aa3015]" />
          <StarSvg size={size * 0.18} className="text-[#aa3015]" />
          <StarSvg size={size * 0.18} className="text-[#aa3015]" />
          <StarSvg size={size * 0.18} className="text-[#aa3015]" />
        </div>
      )}

      {stars >= 7 && (
        <div style={{ position: 'relative', width: size * 0.72, height: size * 0.72 }}>
          <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)' }}><StarSvg size={size * 0.17} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', top: '6px', left: '2px' }}><StarSvg size={size * 0.17} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', top: '6px', right: '2px' }}><StarSvg size={size * 0.17} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}><StarSvg size={size * 0.19} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', bottom: '6px', left: '2px' }}><StarSvg size={size * 0.17} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', bottom: '6px', right: '2px' }}><StarSvg size={size * 0.17} className="text-[#aa3015]" /></div>
          <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)' }}><StarSvg size={size * 0.17} className="text-[#aa3015]" /></div>
        </div>
      )}
    </div>
  );
};

export const CalendarKi: React.FC<CalendarKiProps> = ({
  routines,
  routineExercises,
  exercises,
  workouts,
  workoutSets,
  
  onStartWorkout,
  onOpenRoutineCreator,
  onClaimShenron,
}) => {
  const [viewMode, setViewMode] = useState<'semana' | 'mes'>('semana');
  const [metricTab, setMetricTab] = useState<'racha' | 'metricas'>('racha');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getWeekNumber = (d: Date) => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  const currentWeekNumber = getWeekNumber(currentDate);

  const handlePrev = () => {
    if (viewMode === 'semana') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'semana') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    }
  };

  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayDiff);

    const weekdaysShort = ['LUN', 'MAR', 'MIÃ‰', 'JUE', 'VIE', 'SÃB', 'DOM'];
    const weekdayValues = [1, 2, 3, 4, 5, 6, 0];

    const result = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;

      const trainedWorkouts = workouts.filter(w => w.completed_at && w.completed_at.startsWith(dateStr));
      const hasTrained = trainedWorkouts.length > 0;
      const assignedRoutines = routines.filter(r => r.day_of_week && r.day_of_week.includes(weekdayValues[i]));

      result.push({
        label: weekdaysShort[i],
        dayNum: dayDate.getDate(),
        dateStr,
        weekdayValue: weekdayValues[i],
        hasTrained,
        isToday,
        trainedWorkouts,
        assignedRoutines,
        starCount: i + 1,
        dateObj: dayDate
      });
    }
    return result;
  }, [currentDate, workouts, routines, todayStr]);

  const completedDaysThisWeek = useMemo(() => {
    return weekDays.filter(d => d.hasTrained).length;
  }, [weekDays]);

  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        hasTrained: workouts.some(w => w.completed_at && w.completed_at.startsWith(dateStr)),
        isToday: dateStr === todayStr,
        weekdayValue: prevDate.getDay(),
        dateObj: prevDate
      });
    }

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const dateStr = d.toISOString().split('T')[0];
      const hasTrained = workouts.some(w => w.completed_at && w.completed_at.startsWith(dateStr));
      const isToday = dateStr === todayStr;
      const weekdayValue = d.getDay();
      const hasRoutine = routines.some(r => r.day_of_week && r.day_of_week.includes(weekdayValue));

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        hasTrained,
        hasRoutine,
        isToday,
        weekdayValue,
        dateObj: d
      });
    }

    const remainder = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        hasTrained: workouts.some(w => w.completed_at && w.completed_at.startsWith(dateStr)),
        isToday: dateStr === todayStr,
        weekdayValue: nextDate.getDay(),
        dateObj: nextDate
      });
    }

    return days;
  }, [currentYear, currentMonth, workouts, routines, todayStr]);

  const monthlyTrainedCount = useMemo(() => {
    return monthDays.filter(d => d.isCurrentMonth && d.hasTrained).length;
  }, [monthDays]);

  const targetMonthlyDays = 24;
  const adherencePercent = Math.min(100, Math.round((monthlyTrainedCount / targetMonthlyDays) * 100));

  const selectedDayInfo = useMemo(() => {
    const parts = selectedDateStr.split('-');
    const selDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const weekdayValue = selDate.getDay();
    const isToday = selectedDateStr === todayStr;

    const completedWorkoutsOnDate = workouts.filter(w => w.completed_at && w.completed_at.startsWith(selectedDateStr));
    const wasTrained = completedWorkoutsOnDate.length > 0;

    const assigned = routines.filter(r => r.day_of_week && r.day_of_week.includes(weekdayValue));
    const primaryRoutine = assigned[0] || null;

    let targetExercises: Exercise[] = [];
    if (primaryRoutine) {
      const rels = routineExercises
        .filter(re => re.routine_id === primaryRoutine.id)
        .sort((a, b) => a.order_index - b.order_index);
      targetExercises = rels
        .map(re => exercises.find(e => e.id === re.exercise_id))
        .filter(Boolean) as Exercise[];
    }

    let totalSets = targetExercises.length * 4;
    let totalTonnage = (targetExercises.length * 4 * 70 * 10) / 1000;

    if (wasTrained && completedWorkoutsOnDate.length > 0) {
      const workoutIds = completedWorkoutsOnDate.map(w => w.id);
      const sets = workoutSets.filter(s => workoutIds.includes(s.workout_id) && s.is_completed);
      if (sets.length > 0) {
        totalSets = sets.length;
        totalTonnage = sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0) / 1000;
      }
    }

    const dayNameStr = selDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return {
      dateStr: selectedDateStr,
      dayNameStr: dayNameStr.charAt(0).toUpperCase() + dayNameStr.slice(1),
      isToday,
      wasTrained,
      weekdayValue,
      primaryRoutine,
      targetExercises,
      totalSets,
      totalTonnage: totalTonnage.toFixed(1)
    };
  }, [selectedDateStr, todayStr, workouts, workoutSets, routines, routineExercises, exercises]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header & Controls */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              letterSpacing: '0.1em', 
              textTransform: 'uppercase', 
              color: 'var(--accent-primary, #f4a261)' 
            }}>
              CÃMARA DE GRAVEDAD CC-900
            </span>
            <h1 style={{ 
              fontFamily: 'Outfit, sans-serif', 
              fontSize: '24px', 
              fontWeight: '800', 
              margin: '2px 0 0 0', 
              letterSpacing: '-0.02em',
              color: 'var(--text-primary, #f0f2f5)'
            }}>
              CALENDARIO DE KI
            </h1>
            <p style={{ 
              fontSize: '13px', 
              color: 'var(--text-secondary, #9ca3af)', 
              margin: '2px 0 0 0',
              lineHeight: '1.4'
            }}>
              Organiza tus sesiones en la cÃ¡mara de gravedad â€¢ Frecuencia y racha Saiyan
            </p>
          </div>
          
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface-elevated, #24293a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary, #f4a261)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>calendar_month</span>
          </div>
        </div>

        {/* View Switcher Pill & Date Stepper */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: 'var(--bg-secondary, #1c202e)',
          borderRadius: '9999px',
          padding: '4px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.07))'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewMode('semana')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: viewMode === 'semana' ? 'var(--accent-primary, #f4a261)' : 'transparent',
                color: viewMode === 'semana' ? '#141722' : 'var(--text-secondary, #9ca3af)',
                transition: 'all 0.2s ease',
                boxShadow: viewMode === 'semana' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('mes')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: viewMode === 'mes' ? 'var(--accent-primary, #f4a261)' : 'transparent',
                color: viewMode === 'mes' ? '#141722' : 'var(--text-secondary, #9ca3af)',
                transition: 'all 0.2s ease',
                boxShadow: viewMode === 'mes' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              Mes
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '6px' }}>
            <button
              onClick={handlePrev}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary, #24293a)',
                color: 'var(--text-primary, #f0f2f5)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>

            <span style={{ 
              fontFamily: 'Outfit, sans-serif', 
              fontSize: '12px', 
              fontWeight: '700', 
              color: 'var(--text-primary, #f0f2f5)',
              padding: '0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {monthNames[currentMonth]} {currentYear} {viewMode === 'semana' && `â€¢ Sem ${currentWeekNumber}`}
            </span>

            <button
              onClick={handleNext}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary, #24293a)',
                color: 'var(--text-primary, #f0f2f5)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Carousel Header: Dragon Balls Racha vs MÃ©tricas Saiyan */}
      <section style={{
        backgroundColor: 'var(--bg-secondary, #1c202e)',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid var(--border-color, rgba(255,255,255,0.07))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.07))', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setMetricTab('racha')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: metricTab === 'racha' ? 'var(--accent-primary, #f4a261)' : 'transparent',
                color: metricTab === 'racha' ? '#141722' : 'var(--text-secondary, #9ca3af)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>stars</span>
              <span>Racha Semanal</span>
            </button>
            <button
              onClick={() => setMetricTab('metricas')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: metricTab === 'metricas' ? 'var(--accent-primary, #f4a261)' : 'transparent',
                color: metricTab === 'metricas' ? '#141722' : 'var(--text-secondary, #9ca3af)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>military_tech</span>
              <span>MÃ©tricas Saiyan</span>
            </button>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--accent-primary, #f4a261)',
            backgroundColor: 'rgba(244, 162, 97, 0.12)',
            padding: '3px 8px',
            borderRadius: '9999px'
          }}>
            {completedDaysThisWeek} / 7 Esferas
          </span>
        </div>

        {metricTab === 'racha' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-secondary, #2a9d8f)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--accent-secondary, #2a9d8f)'
              }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary, #f0f2f5)' }}>
                {completedDaysThisWeek} de 7 Esferas del DragÃ³n
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>
              Racha Activa: <strong style={{ color: 'var(--accent-primary, #f4a261)' }}>{completedDaysThisWeek} DÃ­as</strong>
            </span>
          </div>
        )}

        {metricTab === 'metricas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--bg-tertiary, #24293a)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' }}>Entrenados este Mes</span>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary, #f0f2f5)' }}>
                  {monthlyTrainedCount} / {targetMonthlyDays}
                </p>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${adherencePercent}%`, height: '100%', backgroundColor: 'var(--accent-primary, #f4a261)' }} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-tertiary, #24293a)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' }}>Fuego Ki Continuo</span>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--accent-secondary, #2a9d8f)' }}>
                  {completedDaysThisWeek * 3} DÃAS
                </p>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary, #9ca3af)' }}>Adherencia: {adherencePercent}%</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(244, 162, 97, 0.08)',
              border: '1px solid rgba(244, 162, 97, 0.25)',
              borderRadius: '12px',
              padding: '10px 14px'
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '12px', color: 'var(--accent-primary, #f4a261)' }}>
                  InvocaciÃ³n Shenlong Disponible
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' }}>
                  ReÃºne 7 esferas para obtener bonus de Ki
                </p>
              </div>
              <button
                onClick={onClaimShenron}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--accent-primary, #f4a261)',
                  color: '#141722',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: '800',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                RECLAMAR
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Interactive Views (Semana vs Mes) */}
      {viewMode === 'semana' ? (
        <section style={{
          backgroundColor: 'var(--bg-secondary, #1c202e)',
          borderRadius: '16px',
          padding: '12px 8px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.07))',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px'
        }}>
          {weekDays.map((d) => {
            const isSelected = d.dateStr === selectedDateStr;
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDateStr(d.dateStr)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 2px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--accent-primary, #f4a261)' : '1px solid transparent',
                  backgroundColor: isSelected 
                    ? 'rgba(244, 162, 97, 0.12)' 
                    : d.isToday 
                      ? 'var(--bg-tertiary, #24293a)' 
                      : 'transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {d.isToday && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    fontSize: '8px',
                    fontWeight: '900',
                    backgroundColor: 'var(--accent-primary, #f4a261)',
                    color: '#141722',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    letterSpacing: '0.5px'
                  }}>
                    HOY
                  </span>
                )}
                
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  color: isSelected ? 'var(--accent-primary, #f4a261)' : 'var(--text-secondary, #9ca3af)',
                  marginBottom: '2px'
                }}>
                  {d.label}
                </span>

                <span style={{ 
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px', 
                  fontWeight: '800', 
                  color: 'var(--text-primary, #f0f2f5)',
                  marginBottom: '6px'
                }}>
                  {d.dayNum}
                </span>

                {d.hasTrained ? (
                  <DragonBallIcon stars={d.starCount} size={32} />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary, #24293a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-tertiary, #6b7280)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bedtime</span>
                  </div>
                )}
              </button>
            );
          })}
        </section>
      ) : (
        <section style={{
          backgroundColor: 'var(--bg-secondary, #1c202e)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.07))',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', paddingBottom: '4px' }}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayChar, idx) => (
              <span key={idx} style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary, #9ca3af)' }}>
                {dayChar}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {monthDays.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  style={{
                    height: '46px',
                    borderRadius: '10px',
                    border: isSelected 
                      ? '2px solid var(--accent-primary, #f4a261)' 
                      : cell.isToday 
                        ? '1px solid var(--accent-secondary, #2a9d8f)' 
                        : '1px solid transparent',
                    backgroundColor: isSelected
                      ? 'rgba(244, 162, 97, 0.15)'
                      : cell.hasTrained
                        ? 'rgba(255, 190, 59, 0.1)'
                        : cell.isCurrentMonth
                          ? 'var(--bg-tertiary, #24293a)'
                          : 'rgba(255,255,255,0.02)',
                    opacity: cell.isCurrentMonth ? 1 : 0.35,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <span style={{ 
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '12px', 
                    fontWeight: cell.isToday ? '800' : '600',
                    color: cell.isToday 
                      ? 'var(--accent-primary, #f4a261)' 
                      : cell.isCurrentMonth 
                        ? 'var(--text-primary, #f0f2f5)' 
                        : 'var(--text-tertiary, #6b7280)'
                  }}>
                    {cell.dayNum}
                  </span>

                  {cell.hasTrained ? (
                    <span style={{ fontSize: '11px', color: '#ffbe3b', lineHeight: 1 }}>â˜…</span>
                  ) : cell.hasRoutine ? (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-primary, #f4a261)' }} />
                  ) : (
                    <span style={{ fontSize: '9px', color: 'var(--text-tertiary, #6b7280)', opacity: 0.5 }}>-</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            fontSize: '11px', 
            color: 'var(--text-secondary, #9ca3af)', 
            paddingTop: '6px',
            borderTop: '1px solid var(--border-color, rgba(255,255,255,0.07))'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#ffbe3b' }}>â˜…</span> Completado
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'var(--text-tertiary, #6b7280)' }}>shield</span> Descanso
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary, #f4a261)' }} /> Hoy
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-secondary, #2a9d8f)' }} /> Planificado
            </span>
          </div>
        </section>
      )}

      {/* 4. Contextual Selected Day Card (Accordion) */}
      <section style={{
        backgroundColor: 'var(--bg-secondary, #1c202e)',
        borderRadius: '16px',
        border: '1px solid var(--border-color, rgba(255,255,255,0.07))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          height: '4px',
          width: '100%',
          backgroundColor: selectedDayInfo.wasTrained 
            ? 'var(--accent-secondary, #2a9d8f)' 
            : selectedDayInfo.primaryRoutine 
              ? 'var(--accent-primary, #f4a261)' 
              : 'var(--bg-tertiary, #24293a)'
        }} />

        <div 
          onClick={() => setIsAccordionOpen(prev => !prev)}
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary, #24293a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary, #f4a261)',
              flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                {selectedDayInfo.wasTrained ? 'verified' : selectedDayInfo.primaryRoutine ? 'fitness_center' : 'bedtime'}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '11px', 
                  fontWeight: '800', 
                  color: 'var(--accent-primary, #f4a261)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px' 
                }}>
                  {selectedDayInfo.dayNameStr} {selectedDayInfo.isToday && 'â€¢ HOY'}
                </span>

                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  backgroundColor: selectedDayInfo.wasTrained 
                    ? 'rgba(42, 157, 143, 0.15)' 
                    : selectedDayInfo.primaryRoutine 
                      ? 'rgba(244, 162, 97, 0.15)' 
                      : 'rgba(255,255,255,0.08)',
                  color: selectedDayInfo.wasTrained 
                    ? 'var(--accent-secondary, #2a9d8f)' 
                    : selectedDayInfo.primaryRoutine 
                      ? 'var(--accent-primary, #f4a261)' 
                      : 'var(--text-tertiary, #6b7280)'
                }}>
                  {selectedDayInfo.wasTrained ? 'Completado' : selectedDayInfo.primaryRoutine ? 'Programado' : 'Descanso'}
                </span>
              </div>

              <h3 style={{ 
                fontFamily: 'Outfit, sans-serif', 
                fontSize: '17px', 
                fontWeight: '800', 
                margin: '2px 0 0 0', 
                color: 'var(--text-primary, #f0f2f5)' 
              }}>
                {selectedDayInfo.primaryRoutine 
                  ? selectedDayInfo.primaryRoutine.name 
                  : selectedDayInfo.wasTrained 
                    ? 'SesiÃ³n de Entrenamiento Completada' 
                    : 'DÃ­a de Descanso y RegeneraciÃ³n Celular'}
              </h3>
            </div>
          </div>

          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary, #24293a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #9ca3af)',
            transform: isAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>expand_more</span>
          </div>
        </div>

        {isAccordionOpen && (
          <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', paddingTop: '14px' }}>
            {selectedDayInfo.primaryRoutine || selectedDayInfo.wasTrained ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-tertiary, #24293a)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  <span style={{ color: 'var(--text-primary, #f0f2f5)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent-primary, #f4a261)' }}>fitness_center</span>
                    {selectedDayInfo.targetExercises.length || 4} Ejercicios
                  </span>

                  <span style={{ color: 'var(--text-primary, #f0f2f5)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent-secondary, #2a9d8f)' }}>repeat</span>
                    {selectedDayInfo.totalSets} Series
                  </span>

                  <span style={{ color: 'var(--text-secondary, #9ca3af)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent-primary, #f4a261)' }}>speed</span>
                    Volumen: <strong style={{ color: 'var(--text-primary, #f0f2f5)' }}>{selectedDayInfo.totalTonnage}T</strong>
                  </span>
                </div>

                {selectedDayInfo.targetExercises.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedDayInfo.targetExercises.map((ex, i) => (
                      <div 
                        key={ex.id || i}
                        style={{
                          backgroundColor: 'var(--bg-tertiary, #24293a)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-primary, #f0f2f5)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary, #f4a261)' }} />
                        <span style={{ whiteSpace: 'nowrap' }}>{ex.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {selectedDayInfo.primaryRoutine && (
                    <button
                      onClick={() => onStartWorkout(selectedDayInfo.primaryRoutine!)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: 'var(--accent-primary, #f4a261)',
                        color: '#141722',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(244, 162, 97, 0.3)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                      <span>INICIAR SESIÃ“N</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenRoutineCreator(selectedDayInfo.weekdayValue)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '9999px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                      backgroundColor: 'var(--bg-tertiary, #24293a)',
                      color: 'var(--text-primary, #f0f2f5)',
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit_calendar</span>
                    <span>Modificar</span>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #9ca3af)', lineHeight: '1.5' }}>
                  RecuperaciÃ³n de Ki activo para evitar sobreentrenamiento muscular. Ideal para descanso o sesiÃ³n ligera de estiramientos.
                </p>

                <button
                  onClick={() => onOpenRoutineCreator(selectedDayInfo.weekdayValue)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '9999px',
                    border: '1px dashed var(--accent-primary, #f4a261)',
                    backgroundColor: 'rgba(244, 162, 97, 0.08)',
                    color: 'var(--accent-primary, #f4a261)',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                  <span>+ PROGRAMAR RUTINA O CÃPSULA PARA ESTE DÃA</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
};

