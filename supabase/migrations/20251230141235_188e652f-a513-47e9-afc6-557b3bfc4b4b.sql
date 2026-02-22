-- Create attendance table for student check-in
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  schedule_entry_id UUID REFERENCES public.schedule_entries(id) ON DELETE SET NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused')),
  note TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_check_in_date ON public.attendance(check_in_time);
CREATE INDEX idx_attendance_schedule_entry_id ON public.attendance(schedule_entry_id);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers and admins can insert attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers and admins can update attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();