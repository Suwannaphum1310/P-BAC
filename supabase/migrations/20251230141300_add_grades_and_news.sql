-- Migration: Add grades and news tables

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    grade_point NUMERIC(3, 2), -- 0.00 to 4.00
    grade_letter VARCHAR(5),   -- A, B+, etc.
    semester INTEGER NOT NULL,
    academic_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create news table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add sample policies (Enable all for now since it's a dev env or adjust as needed)
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow public read access on news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on grades" ON public.grades FOR ALL USING (true);
CREATE POLICY "Allow admin full access on news" ON public.news FOR ALL USING (true);
