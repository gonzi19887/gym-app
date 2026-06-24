import { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Pause, 
  SkipForward, 
  Check, 
  Award, 
  Flame, 
  Clock,
  ChevronUp,
  Search,
  BookOpen,
  Zap,
  Home,
  Camera
} from 'lucide-react';
import { 
  initDB, 
  addRecord, 
  getRecord,
  getAllRecords, 
  deleteRecord,
  clearAllTables,
  generateUUID,
  queueSyncItem
} from './db/localDb';
import type {
  Profile, 
  Exercise, 
  Routine, 
  RoutineExercise, 
  Workout, 
  WorkoutSet 
} from './db/localDb';
import { seedDatabase } from './db/seed';
import { supabase, isSupabaseConfigured } from './db/supabaseClient';
import { syncLocalQueueToCloud, pullCloudDataToLocal } from './db/sync';

// Web Audio API beep for rest timer completion
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.error('Failed playing audio beep:', err);
  }
};

const triggerVibration = (pattern: number | number[]) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Jujutsu Kaisen thematic rank calculation
const getJJKGrade = (level: number): string => {
  if (level === 1) return 'Chamán de 4.° Grado 🛡️';
  if (level === 2) return 'Chamán de 3.° Grado ⚔️';
  if (level === 3) return 'Chamán de 2.° Grado 🌀';
  if (level === 4) return 'Chamán de 1.° Grado 🔴🔵';
  return 'Chamán de Grado Especial 🔴🔵🟣';
};

const WEEKDAYS = [
  { label: 'L', value: 1, name: 'Lunes' },
  { label: 'M', value: 2, name: 'Martes' },
  { label: 'M', value: 3, name: 'Miércoles' },
  { label: 'J', value: 4, name: 'Jueves' },
  { label: 'V', value: 5, name: 'Viernes' },
  { label: 'S', value: 6, name: 'Sábado' },
  { label: 'D', value: 0, name: 'Domingo' }
];

const JJK_CHARACTER_AVATARS = [
  { name: 'Yuji Itadori', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=150&auto=format&fit=crop' },
  { name: 'Satoru Gojo', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=150&auto=format&fit=crop' },
  { name: 'Megumi Fushiguro', url: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=150&auto=format&fit=crop' },
  { name: 'Nobara Kugisaki', url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=150&auto=format&fit=crop' },
  { name: 'Kento Nanami', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop' },
  { name: 'Maki Zen\'in', url: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=150&auto=format&fit=crop' }
];

const REST_REMINDERS = [
  "💧 Recuerda tomar un sorbo de agua para rehidratar tus reservas de energía maldita.",
  "🧘 Estira suavemente los músculos trabajados para acelerar su recuperación.",
  "💧 La hidratación adecuada optimiza tus reflejos y fuerza en el siguiente set.",
  "🧘 Aprovecha para estirar tus articulaciones y relajar los hombros rígidos.",
  "⚡ Mantén el foco en la respiración y canaliza tu energía maldita para el combate.",
  "💧 Bebe un trago de agua: hidratar tus células previene la fatiga precoz.",
  "🧘 Haz un estiramiento activo suave: mejora el flujo sanguíneo hacia el músculo."
];

function App() {
  // Navigation & General Tabs
  const [activeTab, setActiveTab] = useState<'hoy' | 'calendario' | 'rutinas' | 'ejercicios' | 'progreso'>('hoy');
  
  // Database States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  
  // Search & Filtering
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Routine Creator Modal State
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDays, setNewRoutineDays] = useState<number[]>([]);
  const [newRoutineSelectedExercises, setNewRoutineSelectedExercises] = useState<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    rest: number;
  }[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeCategoryToSelect, setActiveCategoryToSelect] = useState<string | null>(null);

  // Active Workout State
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeWorkoutSets, setActiveWorkoutSets] = useState<WorkoutSet[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  
  // Rest Timer State
  const [timerDuration, setTimerDuration] = useState(60); // seconds
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Gamification & Level Up Overlay State
  const [levelUpInfo, setLevelUpInfo] = useState<{ oldLevel: number; newLevel: number; xpEarned: number } | null>(null);
  const [showBlackFlash, setShowBlackFlash] = useState(false); // Jujutsu personal record burst

  // Profile Editor Modal State
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editClan, setEditClan] = useState('');
  const [editCursedTechnique, setEditCursedTechnique] = useState('');
  const [assigningRoutineDayValue, setAssigningRoutineDayValue] = useState<number | null>(null);

  // Camera & Custom Photo State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Exercise Creator Modal State
  const [showExerciseCreator, setShowExerciseCreator] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('Pecho');
  const [newExerciseMediaMode, setNewExerciseMediaMode] = useState<'upload' | 'url'>('upload');
  const [newExerciseMediaUrl, setNewExerciseMediaUrl] = useState('');
  const [newExerciseMediaFile, setNewExerciseMediaFile] = useState<File | null>(null);
  const [newExerciseTipsText, setNewExerciseTipsText] = useState('');

  // Supabase Auth State
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset_password'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [guestMode, setGuestMode] = useState<boolean>(() => localStorage.getItem('guestMode') === 'true');

  // Dynamic JJK Routine Name Generator
  const isNameManuallyEdited = useRef(false);

  const generateJJKRoutineName = (selectedIds: string[]): string => {
    if (selectedIds.length === 0) return '';
    
    const counts: { [key: string]: number } = {};
    selectedIds.forEach(id => {
      const ex = exercises.find(e => e.id === id);
      if (ex) {
        const cat = ex.category.toUpperCase();
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    
    const sortedCats = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length === 0) return '';
    
    const primaryCat = sortedCats[0][0];
    
    if (primaryCat.includes('BICEPS') || primaryCat.includes('TRICEPS') || primaryCat.includes('ANTEBRAZOS') || primaryCat.includes('BRAZO') || primaryCat.includes('BRAZOS')) {
      const names = [
        'Divergent Fist: Fuerza de Brazos 🤜🌀',
        'Black Flash: Impacto de Brazos ⚡🤛',
        'Boogie Woogie: Danza de Manos 👏✨',
        'Fuerza de Toji: Brazos de Grado Especial 💪🔥'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    if (primaryCat.includes('PECHO')) {
      const names = [
        'Cuerpo de Sukuna: Pecho Blindado 👹🛡️',
        'Ritual de Sangre: Pecho de Acero 🩸🛡️',
        'Escudo de Energía Maldita: Pectoral 🌀🛡️'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    if (primaryCat.includes('ESPALDA')) {
      const names = [
        'Back of the Demon: Espalda Maldita 👺🗡️',
        'Wings of the Curse: Dorsales de Grado Especial 🪽🌀',
        'Restricción Celestial: Espalda de Acero 🦾'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    if (primaryCat.includes('PIERNA') || primaryCat.includes('PANTORRILLA') || primaryCat.includes('CADERA') || primaryCat.includes('PIERNAS')) {
      const names = [
        'Desplazamiento Divino: Piernas de Gojo ⚡👣',
        'Puntapié del Dios del Trueno: Piernas 👣⚡',
        'Velocidad de Toji: Entrenamiento de Piernas 🐆🦿',
        'Ritual del Viento: Piernas Malditas 🌀👣'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    if (primaryCat.includes('ABDOMEN') || primaryCat.includes('TRONCO') || primaryCat.includes('COLUMNA') || primaryCat.includes('ABS') || primaryCat.includes('ABDOMINAL')) {
      const names = [
        'Domain Expansion: Núcleo Absoluto 🔮🧘',
        'Estabilidad del Velo: Core Maldito 🛡️🌀',
        'Fuerza Interior de Nanami: Abdomen 7:3 📐🌀'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    if (primaryCat.includes('HOMBRO') || primaryCat.includes('TRAPECIOS') || primaryCat.includes('HOMBROS')) {
      const names = [
        'Soporte del Cielo: Hombros de Titanio 🦾🌌',
        'Fuerza Escapular: Ritual de Hombros 🦾🌀',
        'Hombros de Sukuna: Carga Maldita 👹🦾'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    if (primaryCat.includes('ESTIRAMIENTOS') || primaryCat.includes('CUELLO') || primaryCat.includes('ESTIRAMIENTO')) {
      const names = [
        'Reverse Cursed Technique: Curación Inversa 🔮🩹',
        'Ritual de Restauración Maldita 🧘🩹',
        'Liberación del Límite de Energía 🌀🩹'
      ];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    const combos = [
      'Heavenly Restriction (Restricción Celestial) 🦾💀',
      'Special Grade Ritual (Ritual de Grado Especial) 👹🔮',
      'Cursed Energy Manifestation (Manifestación de Energía) 🌀⚡',
      'Shaman Training (Entrenamiento de Chamán) 🛡️⚔️'
    ];
    return combos[Math.floor(Math.random() * combos.length)];
  };

  useEffect(() => {
    if (showRoutineCreator) {
      isNameManuallyEdited.current = false;
      setNewRoutineName('');
    }
  }, [showRoutineCreator]);

  useEffect(() => {
    if (showRoutineCreator && (!isNameManuallyEdited.current || newRoutineName === '')) {
      const selectedIds = newRoutineSelectedExercises.map(item => item.id);
      const suggested = generateJJKRoutineName(selectedIds);
      setNewRoutineName(suggested);
    }
  }, [newRoutineSelectedExercises, showRoutineCreator]);

  // Sync state helper to write locally and sync immediately if online
  const saveRecord = async (
    tableName: 'profiles' | 'exercises' | 'routines' | 'routine_exercises' | 'workouts' | 'workout_sets',
    record: any,
    action: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE'
  ) => {
    await addRecord(tableName, record);

    if (isSupabaseConfigured && session) {
      await queueSyncItem({
        action,
        tableName,
        payload: record
      });
      if (navigator.onLine) {
        await syncLocalQueueToCloud();
      }
    }
  };

  // Supabase Auth Change Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setGuestMode(false);
        localStorage.removeItem('guestMode');
        syncLocalQueueToCloud();
        pullCloudDataToLocal().then(() => {
          loadData();
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setGuestMode(false);
        localStorage.removeItem('guestMode');
        syncLocalQueueToCloud();
        pullCloudDataToLocal().then(() => {
          loadData();
        });
      } else {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (isSupabaseConfigured && session) {
        syncLocalQueueToCloud();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [session]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase || !authEmail.trim()) return;
    if (authMode !== 'reset_password' && !authPassword.trim()) return;

    setAuthLoading(true);
    try {
      if (authMode === 'reset_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        alert('¡Enlace enviado! Revisa tu bandeja de entrada (y la carpeta de spam) para restablecer tu contraseña.');
        setAuthMode('login');
      } else if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: authUsername.trim() || 'Chamán Novato'
            }
          }
        });
        if (error) throw error;
        alert('¡Registro exitoso! Si tu configuración de Supabase tiene activa la confirmación de correo (activada por defecto), debes confirmar el correo de verificación antes de poder iniciar sesión.');
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
        setShowProfileEditor(false); // Close modal on success
      }
    } catch (err: any) {
      alert(err.message || 'Error al procesar solicitud');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    localStorage.removeItem('guestMode');
    setGuestMode(false);
    window.location.reload();
  };

  // Object URL cleanups helper
  const createdObjectUrlsRef = useRef<string[]>([]);

  const cleanObjectUrls = () => {
    createdObjectUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to revoke object URL', err);
      }
    });
    createdObjectUrlsRef.current = [];
  };

  const formatExercises = (list: Exercise[]): Exercise[] => {
    cleanObjectUrls();
    return list.map((ex) => {
      if (ex.media_blob) {
        const url = URL.createObjectURL(ex.media_blob);
        createdObjectUrlsRef.current.push(url);
        return {
          ...ex,
          runtime_media_url: url,
        };
      }
      return ex;
    });
  };

  async function loadData() {
    await initDB();
    await seedDatabase();

    // Load Profile
    const userId = session?.user?.id || 'user-default-id';
    let currentProfile = await getRecord<Profile>('profiles', userId);
    if (!currentProfile) {
      currentProfile = {
        id: userId,
        username: session?.user?.user_metadata?.username || 'Yuji Itadori (Chamán Novato)',
        avatar_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=150&auto=format&fit=crop',
        created_at: new Date().toISOString(),
        level: 1,
        experience_points: 0,
        current_streak: 0,
        last_workout_date: ''
      };
      await saveRecord('profiles', currentProfile, 'CREATE');
    }
    setProfile(currentProfile);

    // Load rest
    const loadedExercises = await getAllRecords<Exercise>('exercises');
    let loadedRoutines = await getAllRecords<Routine>('routines');
    let loadedRoutineExs = await getAllRecords<RoutineExercise>('routine_exercises');

    if (loadedRoutines.length === 0 && loadedExercises.length > 0) {
      const pressBanca = loadedExercises.find(e => e.name.includes('Press de Banca'));
      const sentadilla = loadedExercises.find(e => e.name.includes('Sentadilla'));
      const remoBarra = loadedExercises.find(e => e.name.includes('Remo con Barra'));
      const curlBiceps = loadedExercises.find(e => e.name.includes('Curl de Bíceps'));

      const newRoutines: Routine[] = [];
      const newRoutineExs: RoutineExercise[] = [];

      if (pressBanca && remoBarra) {
        const r1: Routine = {
          id: 'routine-torso',
          user_id: currentProfile.id,
          name: 'Destello Negro: Torso Superior ⚡',
          day_of_week: [1, 4], // Monday, Thursday
          created_at: new Date().toISOString()
        };
        newRoutines.push(r1);
        newRoutineExs.push({
          id: generateUUID(),
          routine_id: r1.id,
          exercise_id: pressBanca.id,
          order_index: 0,
          default_sets: 4,
          default_reps: 10,
          default_rest_time: 90
        });
        newRoutineExs.push({
          id: generateUUID(),
          routine_id: r1.id,
          exercise_id: remoBarra.id,
          order_index: 1,
          default_sets: 4,
          default_reps: 10,
          default_rest_time: 90
        });
      }

      if (sentadilla && curlBiceps) {
        const r2: Routine = {
          id: 'routine-inferior',
          user_id: currentProfile.id,
          name: 'Ritual de Fuerza: Inferior y Brazos 🌀',
          day_of_week: [2, 5], // Tuesday, Friday
          created_at: new Date().toISOString()
        };
        newRoutines.push(r2);
        newRoutineExs.push({
          id: generateUUID(),
          routine_id: r2.id,
          exercise_id: sentadilla.id,
          order_index: 0,
          default_sets: 4,
          default_reps: 8,
          default_rest_time: 90
        });
        newRoutineExs.push({
          id: generateUUID(),
          routine_id: r2.id,
          exercise_id: curlBiceps.id,
          order_index: 1,
          default_sets: 3,
          default_reps: 12,
          default_rest_time: 60
        });
      }

      for (const r of newRoutines) {
        await saveRecord('routines', r, 'CREATE');
      }
      for (const re of newRoutineExs) {
        await saveRecord('routine_exercises', re, 'CREATE');
      }

      loadedRoutines = await getAllRecords<Routine>('routines');
      loadedRoutineExs = await getAllRecords<RoutineExercise>('routine_exercises');
    }

    const loadedWorkouts = await getAllRecords<Workout>('workouts');
    const loadedSets = await getAllRecords<WorkoutSet>('workout_sets');

    setExercises(formatExercises(loadedExercises));
    setRoutines(loadedRoutines);
    setRoutineExercises(loadedRoutineExs);
    setWorkouts(loadedWorkouts);
    setWorkoutSets(loadedSets);
  };

  // Helper to determine if a URL represents a video format
  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      url.includes('/video/') ||
      url.includes('video-mp4')
    );
  };

  // Helper to render media previews for both images and silent autoplaying videos
  const renderExerciseMedia = (ex: Exercise, options?: { className?: string; style?: React.CSSProperties }) => {
    const src = ex.runtime_media_url || ex.gif_url;
    const isVideo = ex.media_blob?.type.startsWith('video/') || isVideoUrl(src);

    if (!src) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'rgba(255,255,255,0.03)',
          color: 'var(--text-tertiary)',
          fontSize: '11px',
          fontStyle: 'italic',
          ...options?.style
        }}>
          Sin visualización
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className={options?.className}
          style={{ width: '100%', height: '100%', objectFit: 'contain', ...options?.style }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    return (
      <img
        src={src}
        alt={ex.name}
        className={options?.className}
        style={{ width: '100%', height: '100%', objectFit: 'contain', ...options?.style }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      cleanObjectUrls();
    };
  }, []);

  const openProfileEditor = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditAvatarUrl(profile.avatar_url);
    setEditClan(profile.clan || '');
    setEditCursedTechnique(profile.cursed_technique || '');
    setShowProfileEditor(true);
  };

  const handleSaveProfile = async () => {
    if (!profile || !editUsername.trim()) return;
    const updated = {
      ...profile,
      username: editUsername,
      avatar_url: editAvatarUrl,
      clan: editClan,
      cursed_technique: editCursedTechnique
    };
    await saveRecord('profiles', updated, 'UPDATE');
    setProfile(updated);
    // Stop camera if still running
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setShowProfileEditor(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } } 
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      // Bind stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access failed, falling back to direct native camera app:", err);
      // Trigger native camera capture input
      cameraFallbackInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 300, video.videoHeight || 300);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEditAvatarUrl(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize DB and Load Data
  useEffect(() => {
    loadData();
  }, [session]);

  // Timer interval handling
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(interval);
            setTimeout(() => {
              setIsTimerRunning(false);
              playBeep();
              triggerVibration([100, 50, 100]);
            }, 0);
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerRemaining]);

  // Level calculator
  const getLevelInfo = (xp: number) => {
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const progressXP = xp - currentLevelXP;
    const totalRequiredXP = nextLevelXP - currentLevelXP;
    const percentage = Math.min((progressXP / totalRequiredXP) * 100, 100);

    return { level, currentLevelXP, nextLevelXP, progressXP, totalRequiredXP, percentage };
  };

  // Streak checker helper on load/completed workout
  const checkAndUpdateStreak = (profileToUpdate: Profile, completedDateStr: string): Profile => {
    const lastDateStr = profileToUpdate.last_workout_date;
    if (!lastDateStr) {
      profileToUpdate.current_streak = 1;
      profileToUpdate.last_workout_date = completedDateStr;
      return profileToUpdate;
    }

    const lastDate = new Date(lastDateStr.split('T')[0]);
    const completedDate = new Date(completedDateStr.split('T')[0]);
    const diffTime = Math.abs(completedDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      profileToUpdate.current_streak += 1;
    } else if (diffDays > 1) {
      profileToUpdate.current_streak = 1;
    }
    profileToUpdate.last_workout_date = completedDateStr;
    return profileToUpdate;
  };

  // Schedule/Unschedule Routine helper methods
  const scheduleRoutine = async (routineId: string, dayValue: number) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    
    const updatedDays = routine.day_of_week.includes(dayValue)
      ? routine.day_of_week
      : [...routine.day_of_week, dayValue];
      
    const updatedRoutine = {
      ...routine,
      day_of_week: updatedDays
    };
    
    await saveRecord('routines', updatedRoutine, 'UPDATE');
    setRoutines(prev => prev.map(r => r.id === routineId ? updatedRoutine : r));
  };

  const unscheduleRoutine = async (routineId: string, dayValue: number) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    
    const updatedDays = routine.day_of_week.filter(v => v !== dayValue);
    
    const updatedRoutine = {
      ...routine,
      day_of_week: updatedDays
    };
    
    await saveRecord('routines', updatedRoutine, 'UPDATE');
    setRoutines(prev => prev.map(r => r.id === routineId ? updatedRoutine : r));
  };

  // Create Routine
  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim() || newRoutineSelectedExercises.length === 0 || !profile) return;

    const routineId = generateUUID();
    const newRoutine: Routine = {
      id: routineId,
      user_id: profile.id,
      name: newRoutineName,
      day_of_week: newRoutineDays,
      created_at: new Date().toISOString()
    };

    await saveRecord('routines', newRoutine, 'CREATE');

    // Save routine exercises
    for (let index = 0; index < newRoutineSelectedExercises.length; index++) {
      const config = newRoutineSelectedExercises[index];
      const routineExercise: RoutineExercise = {
        id: generateUUID(),
        routine_id: routineId,
        exercise_id: config.id,
        order_index: index,
        default_sets: config.sets,
        default_reps: config.reps,
        default_rest_time: config.rest
      };
      await saveRecord('routine_exercises', routineExercise, 'CREATE');
    }

    // Refresh Routines list
    const loadedRoutines = await getAllRecords<Routine>('routines');
    const loadedRoutineExs = await getAllRecords<RoutineExercise>('routine_exercises');
    setRoutines(loadedRoutines);
    setRoutineExercises(loadedRoutineExs);

    // Reset Modal Form
    setNewRoutineName('');
    setNewRoutineDays([]);
    setNewRoutineSelectedExercises([]);
    setShowRoutineCreator(false);
  };

  // Create Custom Exercise
  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) return;

    let mediaBlob: Blob | undefined = undefined;
    let gifUrl = newExerciseMediaUrl.trim();

    if (newExerciseMediaMode === 'upload' && newExerciseMediaFile) {
      mediaBlob = newExerciseMediaFile;
      gifUrl = '';
    }

    const newEx: Exercise = {
      id: generateUUID(),
      name: newExerciseName.trim(),
      category: newExerciseCategory,
      gif_url: gifUrl,
      tips: newExerciseTipsText.split('\n').map(t => t.trim()).filter(Boolean),
      is_custom: true,
      media_blob: mediaBlob
    };

    await saveRecord('exercises', newEx, 'CREATE');

    // Refresh exercises list
    const loaded = await getAllRecords<Exercise>('exercises');
    setExercises(formatExercises(loaded));

    // Reset Form
    setNewExerciseName('');
    setNewExerciseCategory('Pecho');
    setNewExerciseMediaMode('upload');
    setNewExerciseMediaUrl('');
    setNewExerciseMediaFile(null);
    setNewExerciseTipsText('');
    setShowExerciseCreator(false);
  };

  // Start a Workout
  const startWorkout = async (routine: Routine) => {
    if (!profile) return;

    // Get Exercises of this routine
    const relExs = routineExercises
      .filter((re) => re.routine_id === routine.id)
      .sort((a, b) => a.order_index - b.order_index);

    const loadedExercises = relExs
      .map((re) => exercises.find((e) => e.id === re.exercise_id))
      .filter(Boolean) as Exercise[];

    if (loadedExercises.length === 0) {
      alert('Esta rutina no tiene ejercicios asignados.');
      return;
    }

    const workoutId = generateUUID();
    const newWorkout: Workout = {
      id: workoutId,
      user_id: profile.id,
      routine_id: routine.id,
      started_at: new Date().toISOString(),
      completed_at: '',
      experience_earned: 0,
      synced: false
    };

    const generatedSets: WorkoutSet[] = [];
    
    // Sort workouts by completed_at descending to find the most recent ones
    const sortedCompletedWorkouts = [...workouts]
      .filter(w => w.completed_at)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    relExs.forEach((re) => {
      // Find the last completed workout session that has completed sets for this specific exercise
      let previousSets: WorkoutSet[] = [];
      const lastCompletedWorkoutWithEx = sortedCompletedWorkouts.find(w => 
        workoutSets.some(s => s.workout_id === w.id && s.exercise_id === re.exercise_id && s.is_completed)
      );

      if (lastCompletedWorkoutWithEx) {
        previousSets = workoutSets
          .filter(s => s.workout_id === lastCompletedWorkoutWithEx.id && s.exercise_id === re.exercise_id && s.is_completed)
          .sort((a, b) => a.set_number - b.set_number);
      }

      for (let s = 1; s <= re.default_sets; s++) {
        // Match the corresponding set index, or repeat the last set if current sets count is higher
        const previousSet = previousSets[s - 1] || previousSets[previousSets.length - 1];

        generatedSets.push({
          id: generateUUID(),
          workout_id: workoutId,
          exercise_id: re.exercise_id,
          set_number: s,
          weight: previousSet ? previousSet.weight : 0,
          reps: previousSet ? previousSet.reps : (re.default_reps || 10),
          rest_time: re.default_rest_time,
          is_completed: false
        });
      }
    });

    setActiveWorkout(newWorkout);
    setActiveRoutine(routine);
    setActiveExercises(loadedExercises);
    setActiveWorkoutSets(generatedSets);
    setActiveExerciseIndex(0);
    setTimerRemaining(0);
    setIsTimerRunning(false);
    setShowBlackFlash(false);
  };

  // Toggle set completion and trigger timer / check Black Flash (PR)
  const handleToggleSet = (setId: string, isCompleted: boolean) => {
    setActiveWorkoutSets((prev) =>
      prev.map((set) => {
        if (set.id === setId) {
          const updated = { ...set, is_completed: isCompleted };
          if (isCompleted) {
            setTimerDuration(set.rest_time);
            setTimerRemaining(set.rest_time);
            setIsTimerRunning(true);
            triggerVibration(50);

            // Check if this set breaks a personal record (1RM)
            if (set.weight > 0 && set.reps > 0) {
              const current1RM = set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30);
              const existingRecord = personalRecords[set.exercise_id];

              if (!existingRecord || current1RM > existingRecord.oneRM) {
                // BLACK FLASH TRIGGERS!
                setShowBlackFlash(true);
                triggerVibration([300, 100, 300]);
                setTimeout(() => setShowBlackFlash(false), 2500); // clear banner after 2.5s
              }
            }
          }
          return updated;
        }
        return set;
      })
    );
  };

  // Set weights / reps modification
  const handleSetChange = (setId: string, field: 'weight' | 'reps', value: number) => {
    setActiveWorkoutSets((prev) =>
      prev.map((set) => {
        if (set.id === setId) {
          return { ...set, [field]: value };
        }
        return set;
      })
    );
  };

  const cancelWorkout = () => {
    if (window.confirm("¿Seguro que deseas cancelar esta misión? Perderás todo el progreso no guardado de esta sesión.")) {
      setActiveWorkout(null);
      setActiveRoutine(null);
      setActiveWorkoutSets([]);
      setActiveExercises([]);
      setActiveExerciseIndex(0);
      setTimerRemaining(0);
      setIsTimerRunning(false);
    }
  };

  // End active Workout and award XP
  const finishWorkout = async () => {
    if (!activeWorkout || !profile) return;

    const completedTime = new Date().toISOString();
    const completedSets = activeWorkoutSets.filter((s) => s.is_completed);

    // 100 XP base, +10 XP per set, +25 XP bonus if all sets are completed
    let xpEarned = 100 + completedSets.length * 10;
    const allSetsCompleted = activeWorkoutSets.every((s) => s.is_completed);
    if (allSetsCompleted && activeWorkoutSets.length > 0) {
      xpEarned += 25;
    }

    const savedWorkout: Workout = {
      ...activeWorkout,
      completed_at: completedTime,
      experience_earned: xpEarned,
      synced: false
    };

    await saveRecord('workouts', savedWorkout, 'CREATE');
    for (const set of activeWorkoutSets) {
      await saveRecord('workout_sets', set, 'CREATE');
    }

    const oldLevelInfo = getLevelInfo(profile.experience_points);
    const newXP = profile.experience_points + xpEarned;
    const newLevelInfo = getLevelInfo(newXP);

    let updatedProfile = {
      ...profile,
      experience_points: newXP,
      level: newLevelInfo.level
    };

    updatedProfile = checkAndUpdateStreak(updatedProfile, completedTime);
    await saveRecord('profiles', updatedProfile, 'UPDATE');

    if (newLevelInfo.level > oldLevelInfo.level) {
      setLevelUpInfo({
        oldLevel: oldLevelInfo.level,
        newLevel: newLevelInfo.level,
        xpEarned
      });
      triggerVibration([200, 100, 200, 100, 300]);
    } else {
      triggerVibration([150, 150]);
    }

    setProfile(updatedProfile);
    setWorkouts(await getAllRecords<Workout>('workouts'));
    setWorkoutSets(await getAllRecords<WorkoutSet>('workout_sets'));

    setActiveWorkout(null);
    setActiveRoutine(null);
    setActiveWorkoutSets([]);
    setActiveExercises([]);
    setActiveExerciseIndex(0);
    setTimerRemaining(0);
    setIsTimerRunning(false);
  };

  const getPersonalRecords = () => {
    const prs: { [exerciseId: string]: { weight: number; reps: number; oneRM: number; date: string } } = {};
    
    workoutSets.forEach((set) => {
      if (!set.is_completed || set.weight <= 0 || set.reps <= 0) return;
      
      const oneRM = set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30);
      const existing = prs[set.exercise_id];

      if (!existing || oneRM > existing.oneRM) {
        const workout = workouts.find((w) => w.id === set.workout_id);
        const date = workout ? new Date(workout.completed_at).toLocaleDateString() : 'N/A';
        
        prs[set.exercise_id] = {
          weight: set.weight,
          reps: set.reps,
          oneRM,
          date
        };
      }
    });

    return prs;
  };

  const personalRecords = getPersonalRecords();
  const levelInfo = profile ? getLevelInfo(profile.experience_points) : null;
  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) || 
    e.category.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  const currentActiveExercise = activeExercises[activeExerciseIndex];
  const currentExerciseSets = activeWorkoutSets.filter((s) => s.exercise_id === currentActiveExercise?.id);

  const getLastSessionSets = () => {
    if (!currentActiveExercise) return [];
    
    const sortedCompleted = [...workouts]
      .filter(w => w.completed_at)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
      
    const lastCompletedWorkoutWithEx = sortedCompleted.find(w => 
      workoutSets.some(s => s.workout_id === w.id && s.exercise_id === currentActiveExercise.id && s.is_completed)
    );
    
    if (!lastCompletedWorkoutWithEx) return [];
    
    return workoutSets
      .filter(s => s.workout_id === lastCompletedWorkoutWithEx.id && s.exercise_id === currentActiveExercise.id && s.is_completed)
      .sort((a, b) => a.set_number - b.set_number);
  };
  
  const lastSessionSets = getLastSessionSets();

  const getWeeklyCalendar = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff);

    const days = [];
    const weekdaysName = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const weekdaysShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weekdayValues = [1, 2, 3, 4, 5, 6, 0]; // Monday is 1, Sunday is 0

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      
      const dateStr = d.toISOString().split('T')[0];
      const trainedWorkouts = workouts.filter((w) => w.completed_at.startsWith(dateStr));

      days.push({
        name: weekdaysShort[i],
        fullName: weekdaysName[i],
        value: weekdayValues[i],
        dateStr,
        dayNum: d.getDate(),
        isToday,
        hasTrained: trainedWorkouts.length > 0,
        trainedWorkouts
      });
    }

    return days;
  };

  const calendarDays = getWeeklyCalendar();

  // Helper to format days assigned for a routine
  const getDaysLabels = (days: number[]) => {
    if (!days || days.length === 0) return 'Sin asignar';
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const sorted = [...days].sort((a, b) => {
      const valA = a === 0 ? 7 : a;
      const valB = b === 0 ? 7 : b;
      return valA - valB;
    });
    return sorted.map(d => names[d]).join(', ');
  };

  // Group exercises by category for routine creator
  const groupedExercises = exercises.reduce((acc, ex) => {
    if (!acc[ex.category]) {
      acc[ex.category] = [];
    }
    acc[ex.category].push(ex);
    return acc;
  }, {} as { [category: string]: Exercise[] });

  if (!session && !guestMode) {
    return (
      <div className="app-container flex flex-col justify-center items-center px-6 py-12 min-h-screen bg-background text-on-background relative overflow-hidden" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100svh', padding: '24px' }}>
        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-lime-500/10 blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-sm z-10 flex flex-col gap-6" style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="text-center mb-4" style={{ textAlign: 'center' }}>
            <h1 className="font-headline text-primary mb-2 uppercase tracking-wide drop-shadow-md" style={{ fontSize: '32px', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: '800' }}>
              Hechicería Fitness
            </h1>
            <p className="text-on-surface-variant uppercase tracking-widest font-semibold" style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '2px' }}>
              Expande tu Dominio • Forja tu Fuerza
            </p>
          </div>

          <div className="card p-6 border border-border-subtle bg-surface-level-1 rounded-2xl shadow-xl flex flex-col gap-4" style={{ marginBottom: 0, padding: '20px' }}>
            {authMode !== 'reset_password' ? (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`btn-secondary flex-1 py-2 text-xs font-bold transition-all ${authMode === 'login' ? 'border-primary text-primary bg-primary/5' : ''}`}
                  style={{
                    flex: 1,
                    border: authMode === 'login' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    backgroundColor: authMode === 'login' ? 'rgba(184, 211, 0, 0.05)' : 'transparent',
                    color: authMode === 'login' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    padding: '10px 0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`btn-secondary flex-1 py-2 text-xs font-bold transition-all ${authMode === 'signup' ? 'border-primary text-primary bg-primary/5' : ''}`}
                  style={{
                    flex: 1,
                    border: authMode === 'signup' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    backgroundColor: authMode === 'signup' ? 'rgba(184, 211, 0, 0.05)' : 'transparent',
                    color: authMode === 'signup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    padding: '10px 0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                >
                  Crear Cuenta
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Restablecer Contraseña</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '10px', marginTop: '4px' }}>Te enviaremos un enlace de recuperación.</p>
              </div>
            )}

            <form onSubmit={handleAuthAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Apodo / Username</label>
                  <input
                    type="text"
                    placeholder="Ej: Gojo Satoru"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  placeholder="chaman@jjk.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {authMode !== 'reset_password' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Contraseña</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('reset_password')}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary w-full py-3 mt-2 text-sm font-extrabold uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.01]"
                style={{ padding: '12px', width: '100%', marginTop: '8px', cursor: 'pointer' }}
              >
                {authLoading 
                  ? 'Canalizando energía...' 
                  : authMode === 'login' 
                    ? 'Entrar ⚡' 
                    : authMode === 'signup' 
                      ? 'Registrarse ⚔️' 
                      : 'Enviar enlace ✉️'}
              </button>

              {authMode === 'reset_password' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginTop: '4px',
                    textAlign: 'center'
                  }}
                >
                  Volver a Iniciar Sesión
                </button>
              )}
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setGuestMode(true);
                localStorage.setItem('guestMode', 'true');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: '600',
                letterSpacing: '1px'
              }}
            >
              Continuar como Invitado 🧘 (Modo Offline)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Header Profile Summary */}
      {!activeWorkout && profile && levelInfo && (
        <header className="app-header">
          <div className="profile-section" style={{ cursor: 'pointer' }} onClick={openProfileEditor} title="Editar hechicero">
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="profile-avatar"
            />
            <div className="profile-details">
              <h3 className="profile-name" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, fontSize: '15px' }}>
                {profile.username} <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>✏️</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div className="profile-level" style={{ fontSize: '11px' }}>
                  <Award size={12} />
                  <span>{getJJKGrade(levelInfo.level)}</span>
                </div>
                {(profile.clan || profile.cursed_technique) && (
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {profile.clan ? `Clan ${profile.clan}` : ''} 
                    {profile.clan && profile.cursed_technique ? ' • ' : ''}
                    {profile.cursed_technique ? `${profile.cursed_technique}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="streak-badge" style={{ borderColor: 'rgba(249, 115, 22, 0.3)', color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
            <Flame size={15} fill="currentColor" />
            <span>Voto: {profile.current_streak} m</span>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="app-main">
        
        {/* BLACK FLASH (PR BREAK) FULLSCREEN BURST EFFECT */}
        {showBlackFlash && (
          <div 
            className="fixed inset-0 flex flex-col items-center justify-center z-50 animate-pop"
            style={{ 
              background: 'radial-gradient(circle, rgba(0,0,0,0.95) 30%, rgba(168,85,247,0.3) 100%)',
              border: '4px solid var(--accent-primary)',
              boxShadow: '0 0 100px rgba(168,85,247,0.6)'
            }}
          >
            <Zap size={72} className="text-purple-400" fill="currentColor" style={{ filter: 'drop-shadow(0 0 20px #a855f7)', animation: 'pulseGlow 0.4s infinite' }} />
            <h1 className="lvl-title" style={{ fontSize: '42px', letterSpacing: '1px', marginTop: '16px' }}>
              DESTELLO NEGRO
            </h1>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', textShadow: '0 0 8px #a855f7', textTransform: 'uppercase' }}>
              ¡BLACK FLASH! ⚡
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              Rompiste tu récord personal. ¡Tu energía maldita se desborda!
            </p>
          </div>
        )}

        {/* LEVEL UP OVERLAY CELEBRATION */}
        {levelUpInfo && (
          <div className="lvl-overlay animate-pop">
            <div className="lvl-badge-container">
              <Award size={52} />
            </div>
            <h1 className="lvl-title">¡ASCENSO DE HECHICERO!</h1>
            <p className="lvl-text">
              Liberaste <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+{levelUpInfo.xpEarned} Energía Maldita (XP)</span> en combate.
            </p>
            <div className="lvl-comparison">
              <span className="lvl-old">{getJJKGrade(levelUpInfo.oldLevel).split(' ')[1]} Grado</span>
              <ChevronRight size={20} className="lvl-arrow" />
              <span className="lvl-new" style={{ fontSize: '20px', fontWeight: '800' }}>{getJJKGrade(levelUpInfo.newLevel)}</span>
            </div>
            <p className="lvl-text" style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
              "¡Has expandido tu Dominio!" 🔮
            </p>
            <button 
              onClick={() => setLevelUpInfo(null)}
              className="btn-primary"
              style={{ width: '100%', maxWidth: '240px' }}
            >
              Continuar Misión
            </button>
          </div>
        )}

        {/* ACTIVE WORKOUT PANEL */}
        {activeWorkout && currentActiveExercise && (
          <div className="overlay-screen animate-slide">
            
            <header className="overlay-header">
              <div>
                <span className="overlay-header-title-sub">Purificando Energía Maldita</span>
                <h2 className="overlay-header-title" style={{ fontSize: '15px' }}>{activeRoutine?.name}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={cancelWorkout} 
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={finishWorkout} 
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Completar
                </button>
              </div>
            </header>

            <div className="overlay-body">
              
              {/* Exercise Selector Dots */}
              <div className="progress-dots">
                {activeExercises.map((ex, idx) => (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`dot ${idx === activeExerciseIndex ? 'active' : ''}`}
                  />
                ))}
              </div>

              {/* Exercise Header */}
              <div className="active-exercise-card">
                <div className="active-exercise-meta">
                  <span className="exercise-tag">{currentActiveExercise.category}</span>
                  <span className="exercise-index-label">
                    Misión {activeExerciseIndex + 1} de {activeExercises.length}
                  </span>
                </div>
                <h3 className="active-exercise-name">{currentActiveExercise.name}</h3>

                {/* Exercise image/illustration */}
                <div className="exercise-image-fallback" style={{ height: '240px', marginTop: '4px', marginBottom: '12px' }}>
                  {renderExerciseMedia(currentActiveExercise)}
                  <div className="exercise-image-fallback-text">Visualización</div>
                </div>

                {/* Collapsible Last Session Stats */}
                <details className="exercise-tips-details group" open style={{ marginTop: '8px', borderLeftColor: 'var(--accent-tertiary)' }}>
                  <summary className="exercise-tips-summary" style={{ color: 'var(--accent-tertiary)' }}>
                    <span>⏮️ Última Sesión Realizada</span>
                    <ChevronDown size={14} style={{ marginLeft: 'auto' }} className="group-open:rotate-180 transition-transform" />
                  </summary>
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {lastSessionSets && lastSessionSets.length > 0 ? (
                      lastSessionSets.map((s) => (
                        <div 
                          key={s.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'rgba(255, 255, 255, 0.01)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                            padding: '4px 0'
                          }}
                        >
                          <span>Serie {s.set_number}</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {s.weight} kg x {s.reps} reps
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                        No hay registros de sesiones previas para este ejercicio. ¡Esta es tu primera sesión!
                      </div>
                    )}
                  </div>
                </details>

                {/* Collapsible Tips */}
                <details className="exercise-tips-details group">
                  <summary className="exercise-tips-summary">
                    <BookOpen size={14} />
                    <span>Técnica maldita de ejecución</span>
                    <ChevronDown size={14} style={{ marginLeft: 'auto' }} className="group-open:rotate-180 transition-transform" />
                  </summary>
                  <ul className="exercise-tips-list">
                    {currentActiveExercise.tips.map((tip, tIdx) => (
                      <li key={tIdx} style={{ marginBottom: '4px' }}>{tip}</li>
                    ))}
                  </ul>
                </details>
              </div>

              {/* Workout Sets Table */}
              <div className="set-table">
                <div className="set-table-header">
                  <span>Serie</span>
                  <span>Peso (kg)</span>
                  <span>Reps</span>
                  <span>Estado</span>
                </div>

                <div className="set-rows-list">
                  {currentExerciseSets.map((set, sIdx) => (
                    <div 
                      key={set.id}
                      className={`set-row ${set.is_completed ? 'completed' : ''}`}
                    >
                      <span className="set-number">{sIdx + 1}</span>
                      
                      <div className="stepper-container">
                        <button
                          type="button"
                          disabled={set.is_completed}
                          onClick={() => handleSetChange(set.id, 'weight', Math.max(0, parseFloat(((set.weight || 0) - 2.5).toFixed(2))))}
                          className="stepper-btn-minus"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          placeholder="0"
                          value={set.weight || ''}
                          disabled={set.is_completed}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleSetChange(set.id, 'weight', parseFloat(e.target.value) || 0)}
                          className="set-input-stepped"
                        />
                        <button
                          type="button"
                          disabled={set.is_completed}
                          onClick={() => handleSetChange(set.id, 'weight', parseFloat(((set.weight || 0) + 2.5).toFixed(2)))}
                          className="stepper-btn-plus"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="stepper-container">
                        <button
                          type="button"
                          disabled={set.is_completed}
                          onClick={() => handleSetChange(set.id, 'reps', Math.max(1, (set.reps || 0) - 1))}
                          className="stepper-btn-minus"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          placeholder="0"
                          value={set.reps || ''}
                          disabled={set.is_completed}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleSetChange(set.id, 'reps', parseInt(e.target.value) || 0)}
                          className="set-input-stepped"
                        />
                        <button
                          type="button"
                          disabled={set.is_completed}
                          onClick={() => handleSetChange(set.id, 'reps', (set.reps || 0) + 1)}
                          className="stepper-btn-plus"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleSet(set.id, !set.is_completed)}
                        className={`check-btn ${set.is_completed ? 'completed' : ''}`}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Rest Timer Banner (Side to Side) */}
            {timerRemaining > 0 && (
              <div className="workout-rest-timer-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div className="timer-circle-wrap">
                    <svg className="timer-circle-svg">
                      <circle cx="20" cy="20" r="17" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" fill="transparent" />
                      <circle cx="20" cy="20" r="17" stroke="var(--accent-primary)" strokeWidth="2.5" fill="transparent" 
                        strokeDasharray="106.8"
                        strokeDashoffset={106.8 - (106.8 * timerRemaining) / timerDuration}
                      />
                    </svg>
                    <span className="timer-seconds">{timerRemaining}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Intervalo de Recarga
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                      {REST_REMINDERS[Math.floor((timerDuration - timerRemaining) / 5) % REST_REMINDERS.length]}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)} 
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <button 
                    onClick={() => setTimerRemaining(0)} 
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <SkipForward size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Exercise Navigation Footer */}
            <footer className="overlay-footer">
              <button
                disabled={activeExerciseIndex === 0}
                onClick={() => setActiveExerciseIndex(prev => prev - 1)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Anterior
              </button>
              <button
                disabled={activeExerciseIndex === activeExercises.length - 1}
                onClick={() => setActiveExerciseIndex(prev => prev + 1)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Siguiente
              </button>
            </footer>

          </div>
        )}

        {/* TAB: HOY */}
        {activeTab === 'hoy' && profile && levelInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Level XP Card */}
            <section className="card">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
              <div className="level-xp-info">
                <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Energía Maldita (XP)</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>
                  {levelInfo.progressXP} / {levelInfo.totalRequiredXP} EM
                </span>
              </div>
              
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${levelInfo.percentage}%` }}
                />
              </div>
              
              <div className="level-range">
                <span>{getJJKGrade(levelInfo.level).split(' ')[1]} Grado</span>
                <span>{getJJKGrade(levelInfo.level + 1).split(' ')[1]} Grado</span>
              </div>
            </section>

            {/* Weekly Calendar Card */}
            <section className="card">
              <h3 className="card-title">
                <Calendar size={15} className="text-purple-400" />
                <span>Misiones Semanales</span>
              </h3>
              
              <div className="calendar-grid">
                {calendarDays.map((day, idx) => (
                  <div key={idx} className="calendar-day">
                    <span className="calendar-day-name">{day.name}</span>
                    <div 
                      className={`calendar-day-box ${day.hasTrained ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
                    >
                      {day.hasTrained ? <Check size={14} strokeWidth={3.5} /> : day.dayNum}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Today's Workout Selector Card */}
            <section className="card">
              <h3 className="card-title">
                <Dumbbell size={15} className="text-purple-400" />
                <span>Misiones del Día</span>
              </h3>
              
              {routines.length === 0 ? (
                <div className="no-routines-container">
                  <p className="no-routines-text">Aún no tienes misiones o rutinas asignadas.</p>
                  <button 
                    onClick={() => setActiveTab('rutinas')}
                    className="btn-primary"
                  >
                    Crear primera rutina
                  </button>
                </div>
              ) : (
                <div className="routine-list">
                  <p className="no-routines-text" style={{ marginBottom: '8px' }}>Selecciona tu objetivo hoy:</p>
                  {routines.map((routine) => {
                    const todayDayIndex = new Date().getDay(); // Sun is 0, Mon is 1, etc.
                    const isScheduledForToday = routine.day_of_week && routine.day_of_week.includes(todayDayIndex);
                    
                    return (
                      <button
                        key={routine.id}
                        onClick={() => startWorkout(routine)}
                        className="routine-item-btn"
                        style={isScheduledForToday ? { borderColor: 'var(--accent-primary)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.1)' } : {}}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 className="routine-name">{routine.name}</h4>
                            {isScheduledForToday && (
                              <span className="exercise-tag" style={{ fontSize: '8px', padding: '2px 5px', color: 'var(--accent-tertiary)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                Programada hoy
                              </span>
                            )}
                          </div>
                          <span className="routine-meta">
                            {routineExercises.filter((re) => re.routine_id === routine.id).length} ejercicios • Días: {getDaysLabels(routine.day_of_week)}
                          </span>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB: CALENDARIO */}
        {activeTab === 'calendario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header Description */}
            <section className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
              <h2 className="lvl-title" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px 0' }}>
                <Calendar size={20} className="text-purple-400" />
                <span>Expansión de Dominio Semanal</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>
                Planifica tu semana de entrenamiento asignando tus rituales a los días correspondientes. Las misiones programadas aparecerán en tu pantalla de inicio.
              </p>
            </section>

            {/* Week Planner List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {calendarDays.map((day) => {
                const dayRoutines = routines.filter(r => r.day_of_week && r.day_of_week.includes(day.value));
                
                return (
                  <section 
                    key={day.value} 
                    className="card"
                    style={{
                      borderColor: day.isToday ? 'var(--accent-primary)' : 'var(--border-color)',
                      boxShadow: day.isToday ? '0 0 15px rgba(168, 85, 247, 0.15)' : 'none',
                      backgroundColor: day.isToday ? 'rgba(20, 20, 25, 0.95)' : 'var(--bg-card)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {/* Day Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                          className={`calendar-day-box ${day.hasTrained ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
                          style={{ width: '36px', height: '36px', fontSize: '12px', flexShrink: 0 }}
                        >
                          {day.hasTrained ? <Check size={14} strokeWidth={3.5} /> : day.dayNum}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: day.isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            {day.fullName}
                            {day.isToday && (
                              <span style={{ fontSize: '8px', padding: '2px 6px', backgroundColor: 'rgba(168, 85, 247, 0.15)', border: '1px solid var(--accent-primary)', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>
                                HOY
                              </span>
                            )}
                          </h4>
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{day.dateStr}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setAssigningRoutineDayValue(assigningRoutineDayValue === day.value ? null : day.value)}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} />
                        <span>Programar</span>
                      </button>
                    </div>

                    {/* Inline Routine Assign/Unassign Selector Dropdown */}
                    {assigningRoutineDayValue === day.value && (
                      <div style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '12px',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                            Programar rutina para {day.fullName}:
                          </span>
                          <button 
                            onClick={() => setAssigningRoutineDayValue(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '10px', cursor: 'pointer' }}
                          >
                            Cerrar
                          </button>
                        </div>
                        
                        {routines.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>No tienes rutinas de hechicería creadas.</p>
                            <button 
                              onClick={() => {
                                setAssigningRoutineDayValue(null);
                                setActiveTab('rutinas');
                                setShowRoutineCreator(true);
                              }}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Crear nueva rutina
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                            {routines.map(r => {
                              const isAlreadyScheduled = r.day_of_week && r.day_of_week.includes(day.value);
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => {
                                    if (isAlreadyScheduled) {
                                      unscheduleRoutine(r.id, day.value);
                                    } else {
                                      scheduleRoutine(r.id, day.value);
                                    }
                                  }}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: isAlreadyScheduled ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-card)',
                                    border: `1px solid ${isAlreadyScheduled ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    textAlign: 'left'
                                  }}
                                >
                                  <span>{r.name}</span>
                                  {isAlreadyScheduled ? (
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: '700', fontSize: '11px' }}>✓ Programada</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>+ Asignar</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scheduled Routines Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dayRoutines.length > 0 ? (
                        dayRoutines.map(routine => {
                          const exercisesCount = routineExercises.filter(re => re.routine_id === routine.id).length;
                          return (
                            <div 
                              key={routine.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {routine.name}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                  {exercisesCount} {exercisesCount === 1 ? 'ejercicio' : 'ejercicios'}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {/* Start Workout Shortcut */}
                                <button
                                  onClick={() => startWorkout(routine)}
                                  className="btn-primary"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Iniciar rutina ahora"
                                >
                                  <Play size={10} fill="currentColor" />
                                  <span>Iniciar</span>
                                </button>

                                {/* Desprogramar Routine Button */}
                                <button
                                  onClick={() => unscheduleRoutine(routine.id, day.value)}
                                  className="btn-secondary"
                                  style={{
                                    padding: '5px 8px',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Quitar programación"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{
                          padding: '12px',
                          textAlign: 'center',
                          backgroundColor: 'rgba(255, 255, 255, 0.01)',
                          border: '1px dashed var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-tertiary)',
                          fontSize: '11px'
                        }}>
                          🧘 Meditación y control de Energía Maldita (Descanso)
                        </div>
                      )}

                      {/* Training Log / Completed Workouts for this Day */}
                      {day.trainedWorkouts && day.trainedWorkouts.length > 0 && (
                        <div style={{ 
                          marginTop: '6px', 
                          borderTop: '1px dashed var(--border-color)', 
                          paddingTop: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Misiones del Día Completadas:
                          </span>
                          {day.trainedWorkouts.map((workout: any) => {
                            const matchingRoutine = routines.find(r => r.id === workout.routine_id);
                            const matchingSets = workoutSets.filter(s => s.workout_id === workout.id && s.is_completed);
                            const durationMinutes = Math.round(
                              (new Date(workout.completed_at).getTime() - new Date(workout.started_at).getTime()) / 60000
                            );
                            
                            return (
                              <div 
                                key={workout.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '11px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.03)',
                                  border: '1px solid rgba(16, 185, 129, 0.1)',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  💥 {matchingRoutine ? matchingRoutine.name : 'Entrenamiento Libre'} 
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                                    ({durationMinutes > 0 ? `${durationMinutes} min` : '<1 min'}, {matchingSets.length} sets)
                                  </span>
                                </span>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                  +{workout.experience_earned} EM
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: RUTINAS */}
        {activeTab === 'rutinas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="overlay-header-title">Rutinas del Templo</h2>
              <button
                onClick={() => setShowRoutineCreator(true)}
                className="btn-primary"
                style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>Nueva Rutina</span>
              </button>
            </div>

            {routines.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                <Dumbbell size={32} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
                <p className="no-routines-text" style={{ fontSize: '13px' }}>No hay ninguna rutina creada.</p>
                <button 
                  onClick={() => setShowRoutineCreator(true)}
                  className="btn-primary"
                  style={{ marginTop: '12px' }}
                >
                  Agregar Rutina
                </button>
              </div>
            ) : (
              <div className="routine-list">
                {routines.map((routine) => {
                  const exercisesCount = routineExercises.filter((re) => re.routine_id === routine.id).length;
                  return (
                    <div 
                      key={routine.id}
                      className="routine-row"
                    >
                      <div className="routine-row-info">
                        <h4 className="routine-row-title">{routine.name}</h4>
                        <p className="routine-row-sub">
                          {exercisesCount} {exercisesCount === 1 ? 'ejercicio' : 'ejercicios'} • Días: {getDaysLabels(routine.day_of_week)}
                        </p>
                      </div>
                      
                      <div className="routine-row-actions">
                        <button
                          onClick={() => startWorkout(routine)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Entrenar
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('¿Seguro que deseas eliminar esta rutina?')) {
                              await deleteRecord('routines', routine.id);
                              const associations = routineExercises.filter(re => re.routine_id === routine.id);
                              for (const assoc of associations) {
                                await deleteRecord('routine_exercises', assoc.id);
                              }
                              setRoutines(await getAllRecords<Routine>('routines'));
                              setRoutineExercises(await getAllRecords<RoutineExercise>('routine_exercises'));
                            }
                          }}
                          className="btn-danger-outline"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ROUTINE CREATOR MODAL */}
            {showRoutineCreator && (
              <div className="overlay-screen animate-slide overflow-y-auto pb-32">
                <header className="overlay-header">
                  <h3 className="overlay-header-title">Forjar Dominio</h3>
                  <button 
                    onClick={() => setShowRoutineCreator(false)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    Volver
                  </button>
                </header>

                <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-lg flex flex-col gap-xl">
                  {/* Header Section */}
                  <section className="flex flex-col gap-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>
                      </div>
                      <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Gestor de Rutinas</h2>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">Forja un nuevo circuito de entrenamiento. Ajusta los parámetros de tu energía maldita.</p>
                  </section>

                  {/* Configuration Form */}
                  <section className="flex flex-col gap-lg bg-surface-level-1 p-md md:p-lg rounded-xl border border-border-subtle relative overflow-hidden">
                    {/* Decorative Glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>
                    
                    {/* Title Input */}
                    <div className="flex flex-col gap-xs z-10">
                      <label className="font-label-md text-label-md text-primary uppercase tracking-wider" htmlFor="routine-name">Nombre del Dominio</label>
                      <div className="relative" aria-live="polite">
                        <input 
                          className="w-full h-14 bg-obsidian-zero border border-border-subtle rounded-lg px-4 pr-12 text-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40" 
                          id="routine-name" 
                          placeholder="Ej. Domain Expansion: Núcleo Absoluto" 
                          type="text"
                          value={newRoutineName}
                          onChange={(e) => {
                            setNewRoutineName(e.target.value);
                            isNameManuallyEdited.current = true;
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const selectedIds = newRoutineSelectedExercises.map(item => item.id);
                            const suggested = generateJJKRoutineName(selectedIds);
                            setNewRoutineName(suggested);
                            isNameManuallyEdited.current = false;
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-2" 
                          title="Generar nombre místico"
                        >
                          <span className="material-symbols-outlined text-xl">auto_awesome</span>
                        </button>
                      </div>
                    </div>

                    {/* Day Selector */}
                    <div className="flex flex-col gap-sm z-10">
                      <div className="flex justify-between items-end">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">Días de Manifestación</label>
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          {newRoutineDays.length} Día{newRoutineDays.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-2 justify-between w-full" role="group" aria-label="Días de entrenamiento">
                        {WEEKDAYS.map((day) => {
                          const isSelected = newRoutineDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                setNewRoutineDays(prev => 
                                  isSelected 
                                    ? prev.filter(v => v !== day.value) 
                                    : [...prev, day.value]
                                );
                              }}
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-label-lg text-label-lg transition-transform active:scale-95 ${
                                isSelected 
                                  ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(184,211,0,0.15)] font-bold' 
                                  : 'bg-obsidian-zero border border-border-subtle text-on-surface-variant hover:border-primary/50'
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  {/* Collapsible Exercise List */}
                  <section className="flex flex-col gap-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-on-surface">Compendio de Técnicas</h3>
                    </div>

                    {Object.entries(groupedExercises).map(([category, catExercises]) => {
                      const isExpanded = !!expandedCategories[category];
                      const selectedInCat = newRoutineSelectedExercises.filter(item => 
                        catExercises.some(ex => ex.id === item.id)
                      );

                      // Dynamic icon for muscle category
                      let catIcon = "fitness_center";
                      let iconBg = "bg-primary/10 text-primary";
                      const upperCat = category.toUpperCase();
                      if (upperCat.includes('ABDOMEN') || upperCat.includes('ABS') || upperCat.includes('NÚCLEO') || upperCat.includes('CORE')) {
                        catIcon = "accessibility_new";
                        iconBg = "bg-secondary-container/30 text-secondary";
                      } else if (upperCat.includes('ESPALDA')) {
                        catIcon = "shield";
                        iconBg = "bg-primary/10 text-primary";
                      } else if (upperCat.includes('HOMBRO')) {
                        catIcon = "sports_martial_arts";
                        iconBg = "bg-secondary-container/30 text-secondary";
                      }

                      return (
                        <div key={category} className="bg-surface-level-1 rounded-xl border border-border-subtle overflow-hidden transition-all duration-300">
                          <button 
                            type="button"
                            className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors focus:outline-none" 
                            onClick={() => {
                              setExpandedCategories(prev => ({
                                ...prev,
                                [category]: !prev[category]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${iconBg}`}>
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{catIcon}</span>
                              </div>
                              <span className="font-headline-md text-body-lg text-on-surface">{category}</span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-[10px]">
                                {selectedInCat.length} Técnica{selectedInCat.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span 
                              className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              expand_more
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 flex flex-col gap-sm">
                              {/* Selected exercises in this category */}
                              {selectedInCat.length === 0 ? (
                                <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                                  <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">do_not_disturb_off</span>
                                  <p className="text-on-surface-variant font-label-md">No hay técnicas asignadas a este grupo.</p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-sm">
                                  {selectedInCat.map((config) => {
                                    const exerciseObj = catExercises.find(e => e.id === config.id);
                                    return (
                                      <div 
                                        key={config.id} 
                                        className="flex flex-col gap-3 p-3 bg-obsidian-zero rounded-lg border border-border-subtle hover:border-primary/30 transition-colors group"
                                      >
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-md bg-surface-bright overflow-hidden flex-shrink-0 relative border border-white/5">
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" aria-hidden="true"></div>
                                              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                                                {exerciseObj ? renderExerciseMedia(exerciseObj, { style: { width: '100%', height: '100%', objectFit: 'cover' } }) : (
                                                  <span className="material-symbols-outlined text-on-surface-variant text-2xl opacity-50">smart_display</span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex flex-col">
                                              <h4 className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">
                                                {config.name}
                                              </h4>
                                              <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">
                                                {config.sets} sets × {config.reps} reps • {config.rest}s desc
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setNewRoutineSelectedExercises(prev => prev.filter(item => item.id !== config.id));
                                              }}
                                              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors" 
                                              aria-label="Eliminar ejercicio"
                                            >
                                              <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary bg-primary/10">
                                              <span className="material-symbols-outlined text-sm">drag_indicator</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Edit Fields */}
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                                          <div>
                                            <label className="text-[10px] text-on-surface-variant/80 uppercase block mb-1">Series</label>
                                            <div className="flex items-center bg-surface-container-high border border-border-subtle rounded overflow-hidden h-7">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = Math.max(1, (config.sets || 1) - 1);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, sets: val } : item)
                                                  );
                                                }}
                                                className="px-2 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                              >
                                                -
                                              </button>
                                              <input 
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={config.sets}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, sets: val } : item)
                                                  );
                                                }}
                                                className="w-full bg-transparent border-none text-xs text-on-surface text-center focus:outline-none p-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = Math.min(12, (config.sets || 1) + 1);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, sets: val } : item)
                                                  );
                                                }}
                                                className="px-2 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-on-surface-variant/80 uppercase block mb-1">Reps</label>
                                            <div className="flex items-center bg-surface-container-high border border-border-subtle rounded overflow-hidden h-7">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = Math.max(1, (config.reps || 1) - 1);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, reps: val } : item)
                                                  );
                                                }}
                                                className="px-2 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                              >
                                                -
                                              </button>
                                              <input 
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={config.reps}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, reps: val } : item)
                                                  );
                                                }}
                                                className="w-full bg-transparent border-none text-xs text-on-surface text-center focus:outline-none p-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = Math.min(100, (config.reps || 1) + 1);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, reps: val } : item)
                                                  );
                                                }}
                                                className="px-2 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-on-surface-variant/80 uppercase block mb-1">Descanso (s)</label>
                                            <div className="flex items-center bg-surface-container-high border border-border-subtle rounded overflow-hidden h-7">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = Math.max(0, (config.rest || 0) - 5);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, rest: val } : item)
                                                  );
                                                }}
                                                className="px-2 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                              >
                                                -
                                              </button>
                                              <input 
                                                type="number"
                                                min="0"
                                                step="5"
                                                value={config.rest}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, rest: val } : item)
                                                  );
                                                }}
                                                className="w-full bg-transparent border-none text-xs text-on-surface text-center focus:outline-none p-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = (config.rest || 0) + 5;
                                                  setNewRoutineSelectedExercises(prev => 
                                                    prev.map(item => item.id === config.id ? { ...item, rest: val } : item)
                                                  );
                                                }}
                                                className="px-2 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Toggle Add Exercises Panel */}
                              {activeCategoryToSelect === category ? (
                                <div className="mt-3 p-3 bg-surface-container-low rounded-lg border border-border-subtle flex flex-col gap-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Añadir Técnicas</span>
                                    <button 
                                      type="button"
                                      onClick={() => setActiveCategoryToSelect(null)}
                                      className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                                    >
                                      Ocultar
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto hide-scrollbar">
                                    {catExercises
                                      .filter(ex => !newRoutineSelectedExercises.some(item => item.id === ex.id))
                                      .map((ex) => (
                                        <button
                                          key={ex.id}
                                          type="button"
                                          onClick={() => {
                                            setNewRoutineSelectedExercises(prev => [
                                              ...prev, 
                                              { id: ex.id, name: ex.name, sets: 4, reps: 10, rest: 60 }
                                            ]);
                                          }}
                                          className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors text-left"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded overflow-hidden bg-obsidian-zero border border-white/5 flex-shrink-0">
                                              {renderExerciseMedia(ex, { style: { width: '100%', height: '100%', objectFit: 'cover' } })}
                                            </div>
                                            <span className="text-xs text-on-surface font-body-md">{ex.name}</span>
                                          </div>
                                          <span className="material-symbols-outlined text-sm text-primary">add_circle</span>
                                        </button>
                                      ))
                                    }
                                    {catExercises.filter(ex => !newRoutineSelectedExercises.some(item => item.id === ex.id)).length === 0 && (
                                      <span className="text-xs text-on-surface-variant italic py-2 text-center">Todas las técnicas han sido añadidas.</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => setActiveCategoryToSelect(category)}
                                  className="w-full py-3 mt-2 border border-dashed border-border-subtle rounded-lg text-on-surface-variant font-label-md flex items-center justify-center gap-2 hover:bg-white/5 hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Ejercicio a {category}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>

                  {/* Save Action */}
                  <div className="pt-6 mt-4 border-t border-white/5 pb-10">
                    <button 
                      onClick={handleCreateRoutine}
                      disabled={!newRoutineName.trim() || newRoutineSelectedExercises.length === 0}
                      className="w-full h-14 rounded-full bg-primary text-on-primary font-bold text-lg tracking-tight shadow-[0_0_30px_rgba(184,211,0,0.15)] hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shimmer_1s_infinite]" aria-hidden="true"></div>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
                      Sellar Ritual
                    </button>
                  </div>
                </main>
              </div>
            )}

          </div>
        )}

        {/* TAB: EJERCICIOS */}
        {activeTab === 'ejercicios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="search-wrapper" style={{ flex: 1, margin: 0 }}>
                <input 
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="search-input"
                />
                <Search size={15} className="search-icon" />
              </div>
              <button
                onClick={() => setShowExerciseCreator(true)}
                className="btn-primary"
                style={{ padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                + Ejercicio
              </button>
            </div>

            {/* Exercise Creator Modal */}
            {showExerciseCreator && (
              <div className="overlay-screen animate-slide">
                <header className="overlay-header">
                  <h3 className="overlay-header-title">Crear Ejercicio Personalizado</h3>
                  <button 
                    onClick={() => setShowExerciseCreator(false)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    Cerrar
                  </button>
                </header>

                <div className="overlay-body">
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label">Nombre del Ejercicio</label>
                    <input 
                      type="text"
                      placeholder="Ej: Curl de bíceps con barra"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select
                      value={newExerciseCategory}
                      onChange={(e) => setNewExerciseCategory(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="Pecho">Pecho</option>
                      <option value="Espalda">Espalda</option>
                      <option value="Piernas">Piernas</option>
                      <option value="Hombros">Hombros</option>
                      <option value="Brazos">Brazos</option>
                      <option value="Abdomen">Abdomen</option>
                      <option value="Cardio">Cardio</option>
                    </select>
                  </div>

                  {/* Media Mode selector */}
                  <div className="form-group">
                    <label className="form-label">Multimedia (Video o Imagen)</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setNewExerciseMediaMode('upload')}
                        className={`btn-secondary ${newExerciseMediaMode === 'upload' ? 'completed' : ''}`}
                        style={{ flex: 1, padding: '8px', fontSize: '11px', border: newExerciseMediaMode === 'upload' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                      >
                        Subir Archivo (Offline)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewExerciseMediaMode('url')}
                        className={`btn-secondary ${newExerciseMediaMode === 'url' ? 'completed' : ''}`}
                        style={{ flex: 1, padding: '8px', fontSize: '11px', border: newExerciseMediaMode === 'url' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                      >
                        Pegar Enlace URL
                      </button>
                    </div>

                    {newExerciseMediaMode === 'upload' ? (
                      <div style={{
                        border: '1.5px dashed var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        cursor: 'pointer'
                      }}
                        onClick={() => document.getElementById('exercise-media-input')?.click()}
                      >
                        <input 
                          id="exercise-media-input"
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setNewExerciseMediaFile(file);
                          }}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {newExerciseMediaFile ? `📂 ${newExerciseMediaFile.name}` : 'Selecciona una foto, video o GIF'}
                        </span>
                      </div>
                    ) : (
                      <input 
                        type="text"
                        placeholder="Ej: https://v1.pinimg.com/...mp4"
                        value={newExerciseMediaUrl}
                        onChange={(e) => setNewExerciseMediaUrl(e.target.value)}
                        className="form-input"
                      />
                    )}
                  </div>

                  {/* Technique Tips */}
                  <div className="form-group">
                    <label className="form-label">Tips de técnica (uno por línea)</label>
                    <textarea
                      placeholder="Ej: Mantén los codos pegados al cuerpo&#10;Contrae el abdomen durante el levantamiento"
                      value={newExerciseTipsText}
                      onChange={(e) => setNewExerciseTipsText(e.target.value)}
                      className="form-input"
                      rows={4}
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>

                <footer className="overlay-footer">
                  <button
                    onClick={() => setShowExerciseCreator(false)}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateExercise}
                    disabled={!newExerciseName.trim() || (newExerciseMediaMode === 'upload' && !newExerciseMediaFile) || (newExerciseMediaMode === 'url' && !newExerciseMediaUrl.trim())}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    Guardar Ejercicio
                  </button>
                </footer>
              </div>
            )}

            <div className="exercise-list">
              {filteredExercises.map((ex) => {
                const isExpanded = expandedExerciseId === ex.id;
                return (
                  <div 
                    key={ex.id}
                    className="exercise-item"
                  >
                    <button
                      onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                      className="exercise-item-header"
                    >
                      <div>
                        <h4 className="exercise-item-name">{ex.name}</h4>
                        <span className="exercise-item-category">{ex.category}</span>
                      </div>
                      <div style={{ color: 'var(--text-tertiary)' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="exercise-item-details animate-pop">
                        <div className="exercise-image-fallback">
                          {renderExerciseMedia(ex)}
                          <div className="exercise-image-fallback-text">Visualización</div>
                        </div>

                        <h5 className="exercise-tips-label">Tips de técnica</h5>
                        <ul className="exercise-tips-bullets">
                          {ex.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB: ESTADÍSTICAS */}
        {activeTab === 'progreso' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-label">Rituales (Entrenamientos)</span>
                <p className="stat-value">{workouts.length}</p>
              </div>
              <div className="stat-box">
                <span className="stat-label">Energía Maldita</span>
                <p className="stat-value">{profile?.experience_points || 0}</p>
              </div>
            </div>

            <section className="card">
              <h3 className="card-title">
                <TrendingUp size={15} className="text-purple-400" />
                <span>Destellos Negros ⚡ (1RM Estimados)</span>
              </h3>
              
              {Object.keys(personalRecords).length === 0 ? (
                <p className="no-routines-text" style={{ textAlign: 'center', padding: '16px 0' }}>
                  Aún no has ejecutado ningún Destello Negro.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(personalRecords).map(([exId, record]) => {
                    const ex = exercises.find((e) => e.id === exId);
                    if (!ex) return null;
                    return (
                      <div key={exId} className="record-row">
                        <div>
                          <h4 className="record-title">{ex.name}</h4>
                          <span className="record-date">Logrado el {record.date}</span>
                        </div>
                        <div>
                          <span className="record-value" style={{ color: 'var(--accent-secondary)' }}>{record.oneRM.toFixed(1)} kg</span>
                          <span className="record-details">
                            {record.weight} kg x {record.reps} reps
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card">
              <h3 className="card-title">
                <Clock size={15} className="text-purple-400" />
                <span>Historial de Rituales</span>
              </h3>

              {workouts.length === 0 ? (
                <p className="no-routines-text" style={{ textAlign: 'center', padding: '16px 0' }}>No hay registros.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {workouts
                    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                    .slice(0, 10)
                    .map((w) => {
                      const wDate = new Date(w.completed_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const routine = routines.find((r) => r.id === w.routine_id);
                      return (
                        <div key={w.id} className="record-row">
                          <div>
                            <h4 className="record-title" style={{ fontSize: '13px' }}>{routine?.name || 'Ritual Libre'}</h4>
                            <span className="record-date">{wDate}</span>
                          </div>
                          <span className="record-value" style={{ fontSize: '12px', color: 'var(--accent-tertiary)' }}>
                            +{w.experience_earned} EM
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>

            <button 
              className="btn-danger-outline" 
              style={{ width: '100%', marginTop: '8px', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
              onClick={async () => {
                if (confirm('¿Seguro que deseas restablecer el templo? Esto eliminará todo tu historial de hechicería y cargará los datos por defecto.')) {
                  await clearAllTables();
                  location.reload();
                }
              }}
            >
              Restablecer Templo (Vaciar Base de Datos)
            </button>

          </div>
        )}

      </main>

      {/* Global Tab Navigation Footer Bar */}
      <nav className="tab-bar">
        <button
          onClick={() => setActiveTab('hoy')}
          className={`tab-button ${activeTab === 'hoy' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <Home size={18} />
          </div>
          <span>Hoy</span>
        </button>

        <button
          onClick={() => setActiveTab('calendario')}
          className={`tab-button ${activeTab === 'calendario' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <Calendar size={18} />
          </div>
          <span>Calendario</span>
        </button>
        
        <button
          onClick={() => setActiveTab('rutinas')}
          className={`tab-button ${activeTab === 'rutinas' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <Dumbbell size={18} />
          </div>
          <span>Rutinas</span>
        </button>

        <button
          onClick={() => setActiveTab('ejercicios')}
          className={`tab-button ${activeTab === 'ejercicios' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <BookOpen size={18} />
          </div>
          <span>Ejercicios</span>
        </button>

        <button
          onClick={() => setActiveTab('progreso')}
          className={`tab-button ${activeTab === 'progreso' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <TrendingUp size={18} />
          </div>
          <span>Progreso</span>
        </button>
      </nav>

      {/* PROFILE EDITOR MODAL */}
      {showProfileEditor && (
        <div className="overlay-screen animate-slide">
          <header className="overlay-header">
            <h3 className="overlay-header-title">Configurar Hechicero</h3>
            <button 
              onClick={() => setShowProfileEditor(false)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              Cerrar
            </button>
          </header>

          <div className="overlay-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">Nombre del Chamán</label>
              <input 
                type="text"
                placeholder="Ej: Yuji Itadori"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clan Hechicero</label>
              <input 
                type="text"
                placeholder="Ej: Gojo, Zen'in, Itadori..."
                value={editClan}
                onChange={(e) => setEditClan(e.target.value)}
                className="form-input"
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['Gojo', 'Zen\'in', 'Itadori', 'Fushiguro', 'Inumaki', 'Kamo'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditClan(c)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: editClan === c ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${editClan === c ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '16px',
                      color: editClan === c ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Clan {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Técnica Ritual / Habilidad Especial</label>
              <input 
                type="text"
                placeholder="Ej: Destello Negro, Diez Sombras..."
                value={editCursedTechnique}
                onChange={(e) => setEditCursedTechnique(e.target.value)}
                className="form-input"
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['Destello Negro ⚡', 'Ilimitado ♾️', 'Diez Sombras 🐺', 'Discurso Maldito 🗣️', 'Restricción Celestial 🏋️', 'Manipulación de Sangre 🩸'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditCursedTechnique(t)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: editCursedTechnique === t ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${editCursedTechnique === t ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '16px',
                      color: editCursedTechnique === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera / Upload Area */}
            <div className="form-group">
              <label className="form-label">Foto de Perfil (Cámara o Galería)</label>
              
              {isCameraActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', maxWidth: '240px', height: '240px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--accent-primary)', transform: 'scaleX(-1)' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '240px' }}>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                    >
                      Capturar 📸
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', fontSize: '12px' }}
                  >
                    <Camera size={14} />
                    <span>Tomar Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', fontSize: '12px' }}
                  >
                    <span>Subir Galería</span>
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <input 
                    type="file"
                    ref={cameraFallbackInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="user"
                    style={{ display: 'none' }}
                  />
                </div>
              )}
              
              {editAvatarUrl && editAvatarUrl.startsWith('data:') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <img 
                    src={editAvatarUrl} 
                    alt="Vista previa foto" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--accent-tertiary)' }}>¡Foto cargada con éxito! ✅</span>
                </div>
              )}
            </div>

            {/* Supabase Cloud Connection & Authentication */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
              marginTop: '10px',
              marginBottom: '10px'
            }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-primary)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                ☁️ Sincronización en la Nube
              </h4>

              {!isSupabaseConfigured ? (
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  El modo nube no está configurado. Agrega las variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` en Vercel/.env para habilitar.
                </div>
              ) : session ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Conectado como:
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', whiteSpace: 'nowrap' }}>
                      {session.user.email}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await syncLocalQueueToCloud();
                        alert('¡Cola de sincronización enviada a la nube!');
                      }}
                      className="btn-primary"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '11px' }}
                    >
                      Sincronizar ahora 🔄
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '11px', borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`btn-secondary ${authMode === 'login' ? 'completed' : ''}`}
                      style={{ flex: 1, padding: '6px', fontSize: '11px', border: authMode === 'login' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)', backgroundColor: authMode === 'login' ? 'rgba(168, 85, 247, 0.05)' : 'transparent' }}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`btn-secondary ${authMode === 'signup' ? 'completed' : ''}`}
                      style={{ flex: 1, padding: '6px', fontSize: '11px', border: authMode === 'signup' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)', backgroundColor: authMode === 'signup' ? 'rgba(168, 85, 247, 0.05)' : 'transparent' }}
                    >
                      Crear Cuenta
                    </button>
                  </div>

                  {authMode === 'signup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Apodo / Username</label>
                      <input
                        type="text"
                        placeholder="Ej: Gojo Satoru"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="form-input"
                        style={{ padding: '8px', fontSize: '12px' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Email</label>
                    <input
                      type="email"
                      placeholder="chaman@jjk.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="form-input"
                      style={{ padding: '8px', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Contraseña</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="form-input"
                      style={{ padding: '8px', fontSize: '12px' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAuthAction}
                    disabled={authLoading}
                    className="btn-primary"
                    style={{ padding: '10px', fontSize: '12px', marginTop: '6px' }}
                  >
                    {authLoading ? 'Procesando...' : authMode === 'login' ? 'Entrar ⚡' : 'Registrarse ⚔️'}
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Avatar URL (Personalizado o selecciona abajo)</label>
              <input 
                type="text"
                placeholder="Pega aquí la URL de tu imagen de avatar..."
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                className="form-input"
                style={{ fontSize: '11px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Presets de Avatares Jujutsu</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {JJK_CHARACTER_AVATARS.map((char) => {
                  const isSelected = editAvatarUrl === char.url;
                  return (
                    <button
                      key={char.name}
                      type="button"
                      onClick={() => setEditAvatarUrl(char.url)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'none',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.05)' : 'transparent',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <img 
                        src={char.url} 
                        alt={char.name} 
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      />
                      <span style={{ fontSize: '10px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? '700' : '400', textAlign: 'center' }}>
                        {char.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <footer className="overlay-footer">
            <button
              onClick={() => setShowProfileEditor(false)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Volver
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={!editUsername.trim()}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              Guardar Cambios
            </button>
          </footer>
        </div>
      )}

    </div>
  );
}

export default App;
