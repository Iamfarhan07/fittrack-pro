
-- 1. Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    target_weight NUMERIC,
    target_calories INTEGER,
    target_protein INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight Logs
CREATE TABLE public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workouts Table
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    split_type TEXT CHECK (split_type IN ('Push', 'Pull', 'Legs')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workout Sets Table
CREATE TABLE public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    weight_kg NUMERIC NOT NULL,
    reps INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Meals Table
CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    food_name TEXT NOT NULL,
    calories NUMERIC NOT NULL,
    protein NUMERIC NOT NULL,
    carbs NUMERIC NOT NULL,
    fats NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
