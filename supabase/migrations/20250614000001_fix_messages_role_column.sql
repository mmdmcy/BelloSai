-- Fix messages table to use 'role' column instead of 'type'
-- This aligns the database schema with the frontend/backend expectations

-- Add the new role column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Copy data from type to role column
UPDATE public.messages 
SET role = type::text 
WHERE role IS NULL;

-- Make role column NOT NULL
ALTER TABLE public.messages 
ALTER COLUMN role SET NOT NULL;

-- Add check constraint to ensure valid values
ALTER TABLE public.messages 
ADD CONSTRAINT messages_role_check 
CHECK (role IN ('user', 'assistant', 'ai'));

-- Update any existing 'ai' values to 'assistant' for consistency
UPDATE public.messages 
SET role = 'assistant' 
WHERE role = 'ai';

-- Update the constraint to only allow user/assistant
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_role_check;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_role_check 
CHECK (role IN ('user', 'assistant'));

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

-- Note: We keep the 'type' column for backward compatibility
-- but new code should use 'role' column 