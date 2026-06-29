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
  Search,
  BookOpen,
  Zap,
  Home,
  Camera,
  User,
  Upload,
  UserCheck,
  Dumbbell,
  Lock
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
import { syncLocalQueueToCloud, pullCloudDataToLocal, migrateGuestDataToUser } from './db/sync';

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
  const [activeTab, setActiveTab] = useState<'hoy' | 'calendario' | 'rutinas' | 'progreso' | 'perfil'>('hoy');
  
  // Database States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  
  // Search & Filtering
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseForGlosario, setSelectedExerciseForGlosario] = useState<Exercise | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [routineExerciseSearch, setRoutineExerciseSearch] = useState('');
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);

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
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isSealingPact, setIsSealingPact] = useState(false);
  const [pactStatus, setPactStatus] = useState<string | null>(null);

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

  const lastProfileIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (profile && lastProfileIdRef.current !== profile.id) {
      setEditUsername(profile.username);
      setEditAvatarUrl(profile.avatar_url);
      setEditClan(profile.clan || 'none');
      setEditCursedTechnique(profile.cursed_technique || '');
      lastProfileIdRef.current = profile.id;
    }
  }, [profile]);

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
    if (action === 'DELETE') {
      await deleteRecord(tableName, record.id);
    } else {
      await addRecord(tableName, record);
    }

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
        migrateGuestDataToUser(session.user.id).then(() => {
          syncLocalQueueToCloud();
          pullCloudDataToLocal().then(() => {
            loadData();
          });
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setGuestMode(false);
        localStorage.removeItem('guestMode');
        migrateGuestDataToUser(session.user.id).then(() => {
          syncLocalQueueToCloud();
          pullCloudDataToLocal().then(() => {
            loadData();
          });
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

  // Auto-sync when app becomes hidden (user switches apps, closes tab, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isSupabaseConfigured && session && navigator.onLine) {
          syncLocalQueueToCloud();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert('Supabase no está configurado.');
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setAuthLoading(false);
    }
  };

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
        setActiveTab('hoy');
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
    await clearAllTables();
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
      if (session && isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (data) {
            currentProfile = data;
            await addRecord('profiles', currentProfile);
          }
        } catch (err) {
          console.error('Failed to fetch profile from cloud:', err);
        }
      }
      
      if (!currentProfile) {
        currentProfile = {
          id: userId,
          username: session?.user?.user_metadata?.full_name || 
                    session?.user?.user_metadata?.name || 
                    session?.user?.user_metadata?.username || 
                    (session?.user?.email ? session.user.email.split('@')[0] : 'Yuji Itadori (Chamán Novato)'),
          avatar_url: session?.user?.user_metadata?.avatar_url || 
                      session?.user?.user_metadata?.picture || 
                      '',
          created_at: new Date().toISOString(),
          level: 1,
          experience_points: 0,
          current_streak: 0,
          last_workout_date: ''
        };
        await saveRecord('profiles', currentProfile, 'CREATE');
      }
    }
    setProfile(currentProfile);
    setEditUsername(currentProfile.username);
    setEditAvatarUrl(currentProfile.avatar_url);
    setEditClan(currentProfile.clan || 'none');
    setEditCursedTechnique(currentProfile.cursed_technique || '');

    // Load rest
    let loadedExercises = await getAllRecords<Exercise>('exercises');
    let loadedRoutines = await getAllRecords<Routine>('routines');
    let loadedRoutineExs = await getAllRecords<RoutineExercise>('routine_exercises');
    let loadedWorkouts = await getAllRecords<Workout>('workouts');
    let loadedSets = await getAllRecords<WorkoutSet>('workout_sets');

    // Filter by current userId to ensure profile isolation
    loadedRoutines = loadedRoutines.filter(r => r.user_id === userId);
    loadedWorkouts = loadedWorkouts.filter(w => w.user_id === userId);
    loadedExercises = loadedExercises.filter(e => !e.is_custom || e.user_id === userId);

    const activeRoutineIds = new Set(loadedRoutines.map(r => r.id));
    loadedRoutineExs = loadedRoutineExs.filter(re => activeRoutineIds.has(re.routine_id));

    const activeWorkoutIds = new Set(loadedWorkouts.map(w => w.id));
    loadedSets = loadedSets.filter(s => activeWorkoutIds.has(s.workout_id));

    const wasSeeded = localStorage.getItem('routinesSeeded') === 'true';
    const isGuest = !session;

    if (loadedRoutines.length === 0 && loadedExercises.length > 0 && isGuest && !wasSeeded) {
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
      loadedRoutines = loadedRoutines.filter(r => r.user_id === userId);
      loadedRoutineExs = await getAllRecords<RoutineExercise>('routine_exercises');
      const updatedRoutineIds = new Set(loadedRoutines.map(r => r.id));
      loadedRoutineExs = loadedRoutineExs.filter(re => updatedRoutineIds.has(re.routine_id));
      localStorage.setItem('routinesSeeded', 'true');
    }

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



  const compressAvatar = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 120, 120);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSaveProfile = async () => {
    if (!profile || !editUsername.trim()) return;
    setIsSealingPact(true);
    setPactStatus('Guardando perfil...');

    try {
      let finalAvatarUrl = editAvatarUrl;
      if (editAvatarUrl && editAvatarUrl.startsWith('data:')) {
        finalAvatarUrl = await compressAvatar(editAvatarUrl);
      }

      const updated = {
        ...profile,
        username: editUsername,
        avatar_url: finalAvatarUrl,
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

      if (isSupabaseConfigured && session && navigator.onLine) {
        setPactStatus('Sincronizando datos en la nube...');
        await syncLocalQueueToCloud();
        
        // Comprobar si queda algo en la cola
        const remainingQueue = await getAllRecords<any>('sync_queue');
        if (remainingQueue.length === 0) {
          setPactStatus('¡Pacto sellado y sincronizado! ⚡');
          alert('¡Pacto sellado y sincronizado en la nube! ⚡');
        } else {
          setPactStatus('Pacto sellado localmente (sincronización pendiente).');
          alert('Perfil guardado localmente, pero quedan elementos pendientes en la cola de sincronización.');
        }
      } else {
        setPactStatus('¡Pacto sellado localmente! ⚡');
        alert('¡Perfil de hechicero guardado localmente! ✅');
      }

      setActiveTab('hoy');
    } catch (err: any) {
      console.error(err);
      setPactStatus('Error al sellar pacto.');
      alert('Error al sellar pacto: ' + (err.message || err));
    } finally {
      setIsSealingPact(false);
      setPactStatus(null);
    }
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

  // Create / Edit Routine
  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim() || newRoutineSelectedExercises.length === 0 || !profile) return;

    const routineId = editingRoutineId || generateUUID();
    const isEditMode = !!editingRoutineId;

    if (isEditMode) {
      const existingRoutine = routines.find(r => r.id === routineId);
      if (!existingRoutine) return;
      const updatedRoutine: Routine = {
        ...existingRoutine,
        name: newRoutineName,
        day_of_week: newRoutineDays
      };
      await saveRecord('routines', updatedRoutine, 'UPDATE');

      // Delete old associations
      const oldAssocs = routineExercises.filter(re => re.routine_id === routineId);
      for (const assoc of oldAssocs) {
        await saveRecord('routine_exercises', assoc, 'DELETE');
      }
    } else {
      const newRoutine: Routine = {
        id: routineId,
        user_id: profile.id,
        name: newRoutineName,
        day_of_week: newRoutineDays,
        created_at: new Date().toISOString()
      };
      await saveRecord('routines', newRoutine, 'CREATE');
    }

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
    setEditingRoutineId(null);
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
            setIsTimerMinimized(false);
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
  ).slice(0, 30);

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

  // Sort exercises inside each category alphabetically (A-Z)
  for (const cat in groupedExercises) {
    groupedExercises[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

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
            <p className="text-on-surface-variant uppercase tracking-widest font-semibold" style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '2px' }}>
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
                    fontSize: '12px'
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
                    fontSize: '12px'
                  }}
                >
                  Crear Cuenta
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Restablecer Contraseña</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>Te enviaremos un enlace de recuperación.</p>
              </div>
            )}

            <form onSubmit={handleAuthAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Apodo / Username</label>
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
                <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Email</label>
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
                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Contraseña</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('reset_password')}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
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

              {authMode !== 'reset_password' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.3 }}></div>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>o continuar con</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.3 }}></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold transition-all border border-border"
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        style={{ fill: '#4285F4' }}
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        style={{ fill: '#34A853' }}
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        style={{ fill: '#FBBC05' }}
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        style={{ fill: '#EA4335' }}
                      />
                    </svg>
                    Google
                  </button>
                </>
              )}

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
          <div className="profile-section" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('perfil')} title="Ver perfil del hechicero">
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="profile-avatar"
            />
            <div className="profile-details">
              <h3 className="profile-name" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, fontSize: '15px' }}>
                {profile.username} <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>✏️</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div className="profile-level" style={{ fontSize: '12px' }}>
                  <Award size={12} />
                  <span>{getJJKGrade(levelInfo.level)}</span>
                </div>
                {(profile.clan || profile.cursed_technique) && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
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
                {activeExercises.map((ex, idx) => {
                  const sets = activeWorkoutSets.filter(s => s.exercise_id === ex.id);
                  const isCompleted = sets.length > 0 && sets.every(s => s.is_completed);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setActiveExerciseIndex(idx)}
                      className={`dot ${idx === activeExerciseIndex ? 'active' : ''} ${isCompleted ? 'completed-white' : ''}`}
                      style={isCompleted ? { backgroundColor: 'var(--text-primary)', boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)' } : undefined}
                    />
                  );
                })}
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
                  {currentExerciseSets.map((set, sIdx) => {
                    const firstUncompletedIdx = currentExerciseSets.findIndex(s => !s.is_completed);
                    const isCompleted = set.is_completed;
                    const isPending = firstUncompletedIdx !== -1 && sIdx > firstUncompletedIdx;

                    return (
                      <div 
                        key={set.id}
                        className={`set-row ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                        style={isPending ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
                      >
                        <span className="set-number">{sIdx + 1}</span>
                        
                        <div className="stepper-container">
                          <button
                            type="button"
                            disabled={isCompleted || isPending}
                            onClick={() => handleSetChange(set.id, 'weight', Math.max(0, parseFloat(((set.weight || 0) - 2.5).toFixed(2))))}
                            className="stepper-btn-minus"
                          >
                            -
                          </button>
                          <input 
                            type="number"
                            placeholder="0"
                            value={set.weight || ''}
                            disabled={isCompleted || isPending}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleSetChange(set.id, 'weight', parseFloat(e.target.value) || 0)}
                            className="set-input-stepped"
                          />
                          <button
                            type="button"
                            disabled={isCompleted || isPending}
                            onClick={() => handleSetChange(set.id, 'weight', parseFloat(((set.weight || 0) + 2.5).toFixed(2)))}
                            className="stepper-btn-plus"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="stepper-container">
                          <button
                            type="button"
                            disabled={isCompleted || isPending}
                            onClick={() => handleSetChange(set.id, 'reps', Math.max(1, (set.reps || 0) - 1))}
                            className="stepper-btn-minus"
                          >
                            -
                          </button>
                          <input 
                            type="number"
                            placeholder="0"
                            value={set.reps || ''}
                            disabled={isCompleted || isPending}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleSetChange(set.id, 'reps', parseInt(e.target.value) || 0)}
                            className="set-input-stepped"
                          />
                          <button
                            type="button"
                            disabled={isCompleted || isPending}
                            onClick={() => handleSetChange(set.id, 'reps', (set.reps || 0) + 1)}
                            className="stepper-btn-plus"
                          >
                            +
                          </button>
                        </div>

                        <button
                          disabled={isPending}
                          onClick={() => handleToggleSet(set.id, !set.is_completed)}
                          className={`check-btn ${isCompleted ? 'completed' : ''}`}
                          style={isPending ? { borderColor: 'transparent', cursor: 'not-allowed', backgroundColor: 'transparent' } : undefined}
                        >
                          {isCompleted ? (
                            <Check size={14} />
                          ) : isPending ? (
                            <Lock size={14} style={{ color: 'var(--text-secondary)', opacity: 0.8 }} />
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Rest Timer Banner (Side to Side) */}
            {/* Active Rest Timer Overlay or Banner */}
            {timerRemaining > 0 && (
              isTimerMinimized ? (
                /* Minimized state: show compact banner with a maximize button */
                <div className="workout-rest-timer-banner" style={{ cursor: 'pointer' }} onClick={() => setIsTimerMinimized(false)}>
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
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Toca para maximizar el descanso
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
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
              ) : (
                /* Full-screen rest overlay with JJK premium styling and backdrop blur */
                <div 
                  className="overlay-screen animate-slide"
                  style={{
                    backgroundColor: 'rgba(7, 7, 10, 0.96)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    zIndex: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
                    ⚡ Intervalo de Recarga ⚡
                  </span>
                  
                  {/* Big SVG Countdown Wheel */}
                  <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <svg style={{ width: '200px', height: '200px', transform: 'rotate(-90deg)' }}>
                      <circle cx="100" cy="100" r="85" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="85" 
                        stroke="var(--accent-primary)" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray="534.07"
                        strokeDashoffset={534.07 - (534.07 * timerRemaining) / timerDuration}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '56px', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{timerRemaining}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>segundos</span>
                    </div>
                  </div>

                  {/* Motivational / Rest Reminder card */}
                  <div 
                    style={{
                      width: '100%',
                      maxWidth: '360px',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '40px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5', margin: 0 }}>
                      {REST_REMINDERS[Math.floor((timerDuration - timerRemaining) / 5) % REST_REMINDERS.length]}
                    </p>
                  </div>

                  {/* Control buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {/* Pause / Resume */}
                      <button 
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: 700
                        }}
                      >
                        {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                        {isTimerRunning ? 'Pausar' : 'Reanudar'}
                      </button>

                      {/* Add +30s */}
                      <button 
                        onClick={() => {
                          setTimerRemaining(prev => prev + 30);
                          setTimerDuration(prev => prev + 30);
                        }}
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: 700
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 800 }}>+30s</span>
                      </button>
                    </div>

                    {/* Skip Timer */}
                    <button 
                      onClick={() => setTimerRemaining(0)}
                      className="btn-primary"
                      style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 700
                      }}
                    >
                      <SkipForward size={16} />
                      Omitir descanso
                    </button>

                    {/* Minimize Overlay */}
                    <button 
                      onClick={() => setIsTimerMinimized(true)}
                      style={{
                        height: '40px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      Minimizar descanso
                    </button>
                  </div>
                </div>
              )
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

            {/* Glossary Trigger Card */}
            <section className="card" style={{ cursor: 'pointer', marginTop: '4px' }} onClick={() => setShowGlossary(true)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} className="text-purple-400" />
                  <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>Glosario de Técnicas</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Ver Catálogo →</span>
              </div>
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
                          type="button"
                          onClick={() => {
                            const assocs = routineExercises.filter(re => re.routine_id === routine.id);
                            assocs.sort((a, b) => a.order_index - b.order_index);
                            const selectedExs = assocs.map(re => {
                              const ex = exercises.find(e => e.id === re.exercise_id);
                              return {
                                id: re.exercise_id,
                                name: ex ? ex.name : 'Ejercicio desconocido',
                                sets: re.default_sets,
                                reps: re.default_reps,
                                rest: re.default_rest_time
                              };
                            });
                            setEditingRoutineId(routine.id);
                            setNewRoutineName(routine.name);
                            setNewRoutineDays(routine.day_of_week);
                            setNewRoutineSelectedExercises(selectedExs);
                            setShowRoutineCreator(true);
                          }}
                          className="btn-secondary-outline"
                          style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Editar rutina"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('¿Seguro que deseas eliminar esta rutina?')) {
                              await saveRecord('routines', routine, 'DELETE');
                              const associations = routineExercises.filter(re => re.routine_id === routine.id);
                              for (const assoc of associations) {
                                await saveRecord('routine_exercises', assoc, 'DELETE');
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
                  <h3 className="overlay-header-title">{editingRoutineId ? 'Reconfigurar Dominio' : 'Forjar Dominio'}</h3>
                  <button 
                    onClick={() => {
                      setShowRoutineCreator(false);
                      setEditingRoutineId(null);
                      setNewRoutineName('');
                      setNewRoutineDays([]);
                      setNewRoutineSelectedExercises([]);
                      setRoutineExerciseSearch('');
                    }}
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

                  {/* Flat Selected Exercises List */}
                  <section className="flex flex-col gap-md">
                    <div className="flex flex-col gap-sm">
                      <h4 className="font-label-md text-label-md text-primary uppercase tracking-wider" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                        Técnicas Seleccionadas ({newRoutineSelectedExercises.length})
                      </h4>
                      {newRoutineSelectedExercises.length === 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-border-subtle rounded-xl bg-obsidian-zero">
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">do_not_disturb_off</span>
                          <p className="text-on-surface-variant font-label-md" style={{ fontSize: '12px' }}>
                            No hay técnicas seleccionadas. Usa el buscador de abajo para añadir técnicas.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-sm">
                          {newRoutineSelectedExercises.map((config) => {
                            const exerciseObj = exercises.find(e => e.id === config.id);
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
                                      <h4 className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                        {config.name}
                                      </h4>
                                      <p className="font-label-md text-label-md text-on-surface-variant mt-0.5" style={{ fontSize: '12px' }}>
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
                                  </div>
                                </div>

                                {/* Edit Fields */}
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant/80 uppercase block mb-1" style={{ fontSize: '12px' }}>Series</label>
                                    <div className="flex items-center bg-surface-container-high border border-border-subtle rounded overflow-hidden h-8">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.max(1, (config.sets || 1) - 1);
                                          setNewRoutineSelectedExercises(prev => 
                                            prev.map(item => item.id === config.id ? { ...item, sets: val } : item)
                                          );
                                        }}
                                        className="px-3 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                        style={{ fontSize: '12px' }}
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
                                        style={{ fontSize: '12px' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.min(12, (config.sets || 1) + 1);
                                          setNewRoutineSelectedExercises(prev => 
                                            prev.map(item => item.id === config.id ? { ...item, sets: val } : item)
                                          );
                                        }}
                                        className="px-3 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                        style={{ fontSize: '12px' }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant/80 uppercase block mb-1" style={{ fontSize: '12px' }}>Reps</label>
                                    <div className="flex items-center bg-surface-container-high border border-border-subtle rounded overflow-hidden h-8">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.max(1, (config.reps || 1) - 1);
                                          setNewRoutineSelectedExercises(prev => 
                                            prev.map(item => item.id === config.id ? { ...item, reps: val } : item)
                                          );
                                        }}
                                        className="px-3 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                        style={{ fontSize: '12px' }}
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
                                        style={{ fontSize: '12px' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.min(100, (config.reps || 1) + 1);
                                          setNewRoutineSelectedExercises(prev => 
                                            prev.map(item => item.id === config.id ? { ...item, reps: val } : item)
                                          );
                                        }}
                                        className="px-3 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                        style={{ fontSize: '12px' }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant/80 uppercase block mb-1" style={{ fontSize: '12px' }}>Descanso (s)</label>
                                    <div className="flex items-center bg-surface-container-high border border-border-subtle rounded overflow-hidden h-8">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = Math.max(0, (config.rest || 0) - 5);
                                          setNewRoutineSelectedExercises(prev => 
                                            prev.map(item => item.id === config.id ? { ...item, rest: val } : item)
                                          );
                                        }}
                                        className="px-3 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                        style={{ fontSize: '12px' }}
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
                                        style={{ fontSize: '12px' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = (config.rest || 0) + 5;
                                          setNewRoutineSelectedExercises(prev => 
                                            prev.map(item => item.id === config.id ? { ...item, rest: val } : item)
                                          );
                                        }}
                                        className="px-3 text-xs text-on-surface-variant hover:text-primary h-full hover:bg-white/5 transition-colors font-bold"
                                        style={{ fontSize: '12px' }}
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
                    </div>
                  </section>

                  {/* Add Exercises Panel (Search-to-add flat list) */}
                  <section className="flex flex-col gap-md">
                    <label className="font-label-md text-label-md text-primary uppercase tracking-wider" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      Añadir Técnicas
                    </label>
                    <div className="search-wrapper" style={{ margin: '4px 0', position: 'relative' }}>
                      <input 
                        type="text"
                        placeholder="Buscar técnica para agregar..."
                        value={routineExerciseSearch}
                        onChange={(e) => setRoutineExerciseSearch(e.target.value)}
                        className="search-input w-full bg-obsidian-zero border border-border-subtle rounded-lg px-4 py-3 text-on-surface font-body-md"
                        style={{ paddingLeft: '40px', fontSize: '13px' }}
                      />
                      <Search size={16} className="search-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>

                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                      {(() => {
                        const matchingExercises = exercises.filter(ex => 
                          ex.name.toLowerCase().includes(routineExerciseSearch.toLowerCase()) ||
                          ex.category.toLowerCase().includes(routineExerciseSearch.toLowerCase())
                        );

                        // Only display available exercises (not already in newRoutineSelectedExercises)
                        const availableMatching = matchingExercises.filter(ex => 
                          !newRoutineSelectedExercises.some(item => item.id === ex.id)
                        ).slice(0, 20);

                        if (routineExerciseSearch.trim() === '') {
                          return (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                              Escribe en el buscador de arriba para encontrar y añadir técnicas...
                            </span>
                          );
                        }

                        if (availableMatching.length === 0) {
                          return (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                              No se encontraron técnicas disponibles.
                            </span>
                          );
                        }

                        return availableMatching.map((ex) => (
                          <div
                            key={ex.id}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '10px 12px', 
                              borderRadius: '8px', 
                              border: '1px solid var(--border-color)', 
                              backgroundColor: 'var(--bg-secondary)'
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded overflow-hidden bg-obsidian-zero border border-white/5 flex-shrink-0">
                                {renderExerciseMedia(ex, { style: { width: '100%', height: '100%', objectFit: 'cover' } })}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{ex.name}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ex.category}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNewRoutineSelectedExercises(prev => [
                                  ...prev,
                                  { id: ex.id, name: ex.name, sets: 4, reps: 10, rest: 60 }
                                ]);
                              }}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <Plus size={14} />
                              <span>Agregar</span>
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
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
                      {editingRoutineId ? 'Actualizar Ritual ⚡' : 'Sellar Ritual'}
                    </button>
                  </div>
                </main>
              </div>
            )}

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
                <p className="no-routines-text" style={{ textAlign: 'center', padding: '16px 0', fontSize: '12px' }}>
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
                          <h4 className="record-title" style={{ fontSize: '13px' }}>{ex.name}</h4>
                          <span className="record-date" style={{ fontSize: '12px' }}>Logrado el {record.date}</span>
                        </div>
                        <div>
                          <span className="record-value" style={{ color: 'var(--accent-secondary)', fontSize: '13px' }}>{record.oneRM.toFixed(1)} kg</span>
                          <span className="record-details" style={{ fontSize: '12px' }}>
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
                <p className="no-routines-text" style={{ textAlign: 'center', padding: '16px 0', fontSize: '12px' }}>No hay registros.</p>
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
                            <span className="record-date" style={{ fontSize: '12px' }}>{wDate}</span>
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

        {/* TAB: PERFIL */}
        {activeTab === 'perfil' && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '160px' }}>
            
            {/* Header Section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-headline)', color: 'var(--text-primary)', fontWeight: 'bold', margin: 0 }}>
                Forja tu Identidad
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(184, 211, 0, 0.1)',
                border: '1px solid rgba(184, 211, 0, 0.2)',
                padding: '4px 12px',
                borderRadius: '9999px',
                width: 'fit-content',
                marginTop: '4px'
              }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px', color: 'var(--accent-primary)' }}>military_tech</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '13px' }}>
                  Nivel {profile.level || 1}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Configura tu avatar chamánico y afilia tu técnica maldita.
              </p>
            </section>

            {/* Avatar Selection Card */}
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '24px' }}>
              <h3 className="form-label" style={{ alignSelf: 'flex-start', margin: 0, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
                Foto de Perfil
              </h3>
              
              <div style={{
                position: 'relative',
                width: '128px',
                height: '128px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 0 25px rgba(184, 211, 0, 0.2)',
                backgroundColor: 'var(--bg-secondary)',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {editAvatarUrl ? (
                  <img 
                    src={editAvatarUrl} 
                    alt="Profile Photo" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Dumbbell size={48} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
                )}
              </div>

              {isCameraActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', marginTop: '12px' }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', maxWidth: '240px', height: '240px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--accent-primary)', transform: 'scaleX(-1)' }}
                  />
                  <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '240px' }}>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="btn-primary"
                      style={{ flex: 1, padding: '10px 14px', fontSize: '12px' }}
                    >
                      Capturar 📸
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '10px 14px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '13px', borderRadius: '12px' }}
                  >
                    <Upload size={14} color="var(--accent-primary)" />
                    <span>Subir Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '13px', borderRadius: '12px' }}
                  >
                    <Camera size={14} color="var(--accent-primary)" />
                    <span>Tomar Foto</span>
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
            </section>

            {/* Configuración de Datos */}
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className="card-title">
                <User size={15} className="text-purple-400" />
                <span>Datos del Chamán</span>
              </h3>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre del Chamán</label>
                <input 
                  type="text"
                  placeholder="Ej: Yuji Itadori"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>Linaje / Clan</label>
                <select 
                  value={editClan}
                  onChange={(e) => setEditClan(e.target.value)}
                  className="form-input"
                  style={{ 
                    fontSize: '13px', 
                    width: '100%', 
                    backgroundColor: 'var(--bg-primary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="none">Sin Afiliación (Hechicero de 1ra Generación)</option>
                  <option value="Gojo">Clan Gojo (Los Seis Ojos)</option>
                  <option value="Zen'in">Clan Zenin (Restricción Celestial)</option>
                  <option value="Kamo">Clan Kamo (Manipulación de Sangre)</option>
                  <option value="Itadori">Clan Itadori</option>
                  <option value="Fushiguro">Clan Fushiguro</option>
                  <option value="Inumaki">Clan Inumaki</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>Técnica Ritual / Habilidad Especial</label>
                <input 
                  type="text"
                  placeholder="Ej: Destello Negro, Diez Sombras..."
                  value={editCursedTechnique}
                  onChange={(e) => setEditCursedTechnique(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {['Destello Negro ⚡', 'Ilimitado ♾️', 'Diez Sombras 🐺', 'Discurso Maldito 🗣️', 'Restricción Celestial 🏋️', 'Manipulación de Sangre 🩸'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditCursedTechnique(t)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: editCursedTechnique === t ? 'rgba(184, 211, 0, 0.15)' : 'rgba(255,255,255,0.03)',
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
            </section>

            {/* Supabase Cloud Connection & Authentication */}
            {!session ? (
              <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-primary)', margin: 0, letterSpacing: '0.5px' }}>
                  ☁️ Alianza con la Nube (Iniciar Sesión)
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`btn-secondary ${authMode === 'login' ? 'completed' : ''}`}
                      style={{ flex: 1, padding: '10px', fontSize: '12px', border: authMode === 'login' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)', backgroundColor: authMode === 'login' ? 'rgba(168, 85, 247, 0.05)' : 'transparent' }}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`btn-secondary ${authMode === 'signup' ? 'completed' : ''}`}
                      style={{ flex: 1, padding: '10px', fontSize: '12px', border: authMode === 'signup' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)', backgroundColor: authMode === 'signup' ? 'rgba(168, 85, 247, 0.05)' : 'transparent' }}
                    >
                      Crear Cuenta
                    </button>
                  </div>

                  {authMode === 'signup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Apodo / Username</label>
                      <input
                        type="text"
                        placeholder="Ej: Gojo Satoru"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="form-input"
                        style={{ padding: '10px', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Email</label>
                    <input
                      type="email"
                      placeholder="chaman@jjk.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="form-input"
                      style={{ padding: '10px', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>Contraseña</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="form-input"
                      style={{ padding: '10px', fontSize: '13px' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAuthAction}
                    disabled={authLoading}
                    className="btn-primary"
                    style={{ padding: '12px', fontSize: '12px', marginTop: '6px' }}
                  >
                    {authLoading ? 'Procesando...' : authMode === 'login' ? 'Entrar ⚡' : 'Registrarse ⚔️'}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="btn-secondary"
                    style={{ 
                      padding: '12px', 
                      fontSize: '12px', 
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Entrar con Google</span>
                  </button>
                </div>
              </section>
            ) : (
              /* Romper Pacto / Estado de Alianza */
              <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #ef4444' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💀 Estado de Alianza</span>
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Conectado como: <strong>{session.user.email}</strong>. Al romper el pacto, se cerrará tu sesión actual y se limpiará el templo local de este dispositivo.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ 
                    padding: '12px', 
                    fontSize: '13px', 
                    borderColor: '#ef4444', 
                    color: '#ef4444',
                    width: '100%',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Romper Pacto (Cerrar Sesión)
                </button>
              </section>
            )}

            {/* Save Button */}
            <div style={{ 
              position: 'fixed',
              bottom: '76px', 
              left: '16px',
              right: '16px',
              zIndex: 90
            }}>
              <button
                onClick={handleSaveProfile}
                disabled={!editUsername.trim() || isSealingPact}
                className="btn-primary"
                style={{ 
                  width: '100%',
                  padding: '14px', 
                  borderRadius: '30px', 
                  fontWeight: 700, 
                  fontSize: '14px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 20px rgba(184, 211, 0, 0.4)',
                  border: 'none',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{pactStatus || 'Sellar Pacto'}</span>
                <UserCheck size={16} strokeWidth={3} />
              </button>
            </div>

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
          onClick={() => setActiveTab('progreso')}
          className={`tab-button ${activeTab === 'progreso' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <TrendingUp size={18} />
          </div>
          <span>Progreso</span>
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <User size={18} />
          </div>
          <span>Perfil</span>
        </button>
      </nav>

      {/* GLOSARIO DE TÉCNICAS (MODAL DE DOMINIO EXPANSIÓN) */}
      {showGlossary && (
        <div 
          className="overlay-screen animate-slide"
          style={{ 
            backgroundColor: 'rgba(7, 7, 10, 0.96)', 
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 150,
            overflowY: 'auto',
            paddingBottom: '100px'
          }}
        >
          <header className="overlay-header">
            <h3 className="overlay-header-title">Glosario de Técnicas</h3>
            <button 
              onClick={() => setShowGlossary(false)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Cerrar
            </button>
          </header>

          <div className="overlay-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="search-wrapper" style={{ flex: 1, margin: 0 }}>
                <input 
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="search-input"
                  style={{ fontSize: '13px' }}
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
              <div className="overlay-screen animate-slide" style={{ zIndex: 180 }}>
                <header className="overlay-header">
                  <h3 className="overlay-header-title">Crear Ejercicio Personalizado</h3>
                  <button 
                    onClick={() => setShowExerciseCreator(false)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Cerrar
                  </button>
                </header>

                <div className="overlay-body" style={{ padding: '16px' }}>
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label">Nombre del Ejercicio</label>
                    <input 
                      type="text"
                      placeholder="Ej: Curl de bíceps con barra"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select
                      value={newExerciseCategory}
                      onChange={(e) => setNewExerciseCategory(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
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
                        style={{ flex: 1, padding: '10px', fontSize: '12px', border: newExerciseMediaMode === 'upload' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                      >
                        Subir Archivo (Offline)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewExerciseMediaMode('url')}
                        className={`btn-secondary ${newExerciseMediaMode === 'url' ? 'completed' : ''}`}
                        style={{ flex: 1, padding: '10px', fontSize: '12px', border: newExerciseMediaMode === 'url' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
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
                        onClick={() => document.getElementById('exercise-media-input-glossary')?.click()}
                      >
                        <input 
                          id="exercise-media-input-glossary"
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
                        style={{ fontSize: '13px' }}
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
                      style={{ resize: 'none', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <footer className="overlay-footer">
                  <button
                    onClick={() => setShowExerciseCreator(false)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '12px', fontSize: '13px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateExercise}
                    disabled={!newExerciseName.trim() || (newExerciseMediaMode === 'upload' && !newExerciseMediaFile) || (newExerciseMediaMode === 'url' && !newExerciseMediaUrl.trim())}
                    className="btn-primary"
                    style={{ flex: 1, padding: '12px', fontSize: '13px' }}
                  >
                    Guardar Ejercicio
                  </button>
                </footer>
              </div>
            )}

            <div className="exercise-list">
              {filteredExercises.map((ex) => (
                <div 
                  key={ex.id}
                  className="exercise-item"
                >
                  <button
                    onClick={() => setSelectedExerciseForGlosario(ex)}
                    className="exercise-item-header"
                  >
                    <div>
                      <h4 className="exercise-item-name" style={{ fontSize: '13px', fontWeight: 'bold' }}>{ex.name}</h4>
                      <span className="exercise-item-category" style={{ fontSize: '12px' }}>{ex.category}</span>
                    </div>
                    <div style={{ color: 'var(--text-tertiary)' }}>
                      <BookOpen size={16} />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GLOSARIO DE TÉCNICAS (MODAL DE DOMINIO EXPANSIÓN) */}
      {selectedExerciseForGlosario && (
        <div 
          className="overlay-screen animate-slide"
          style={{ 
            backgroundColor: 'rgba(7, 7, 10, 0.96)', 
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 200,
            overflowY: 'auto'
          }}
        >
          <header className="overlay-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="overlay-header-title-sub" style={{ color: 'var(--accent-primary)', fontSize: '11px', display: 'block' }}>Glosario de Técnicas</span>
              <h3 className="overlay-header-title" style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{selectedExerciseForGlosario.name}</h3>
            </div>
            <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px' }}>
              {selectedExerciseForGlosario.category}
            </span>
          </header>

          <div className="overlay-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', paddingBottom: '100px' }}>
            {/* GIF Demostrativo */}
            <div 
              className="exercise-image-container" 
              style={{ 
                width: '100%', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                backgroundColor: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
              }}
            >
              {renderExerciseMedia(selectedExerciseForGlosario)}
            </div>

            {/* Structured Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Posición Inicial */}
              {selectedExerciseForGlosario.posicion_inicial && selectedExerciseForGlosario.posicion_inicial.length > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 style={{ color: 'var(--accent-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <span>🥋</span> Posición Inicial
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {selectedExerciseForGlosario.posicion_inicial.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ejecución */}
              {selectedExerciseForGlosario.ejecucion && selectedExerciseForGlosario.ejecucion.length > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 style={{ color: 'var(--accent-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <span>⚔️</span> Ejecución
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {selectedExerciseForGlosario.ejecucion.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Consejos */}
              {selectedExerciseForGlosario.consejos && selectedExerciseForGlosario.consejos.length > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 style={{ color: 'var(--accent-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <span>💡</span> Tips e Indicaciones
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {selectedExerciseForGlosario.consejos.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Variantes */}
              {selectedExerciseForGlosario.variantes && selectedExerciseForGlosario.variantes.length > 0 && (
                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 style={{ color: 'var(--accent-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <span>🌀</span> Variantes
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {selectedExerciseForGlosario.variantes.map((variant, i) => (
                      <li key={i}>{variant}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>

          {/* Botón flotante para cerrar */}
          <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => setSelectedExerciseForGlosario(null)}
              className="btn-primary"
              style={{ 
                padding: '10px 24px', 
                borderRadius: '30px', 
                fontWeight: 700, 
                fontSize: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)'
              }}
            >
              🔴 Cerrar Dominio
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
