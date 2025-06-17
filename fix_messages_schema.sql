-- BelloSai Messages Schema Fix
-- Run this in your Supabase SQL Editor to fix the messages table schema
-- This ensures consistency between 'role' and 'type' columns

-- Step 1: Check current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add role column if it doesn't exist
DO $$
BEGIN
    -- Check if 'role' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        -- Add role column
        ALTER TABLE public.messages ADD COLUMN role TEXT;
        RAISE NOTICE 'Added role column to messages table';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
END $$;

-- Step 3: Migrate data from type to role if needed
DO $$
BEGIN
    -- Check if we have data to migrate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'type' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM public.messages WHERE role IS NULL
    ) THEN
        -- Convert 'ai' to 'assistant' and keep 'user' as is
        UPDATE public.messages 
        SET role = CASE 
            WHEN type = 'ai' THEN 'assistant'
            WHEN type = 'user' THEN 'user'
            ELSE 'user' -- fallback
        END
        WHERE role IS NULL;
        
        RAISE NOTICE 'Migrated data from type to role column';
    ELSE
        RAISE NOTICE 'No data migration needed';
    END IF;
END $$;

-- Step 4: Make role column NOT NULL and add constraint
DO $$
BEGIN
    -- Make role column NOT NULL if it isn't already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'role' 
        AND table_schema = 'public'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.messages 
        ALTER COLUMN role SET NOT NULL;
        RAISE NOTICE 'Set role column to NOT NULL';
    END IF;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'messages_role_check'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant'));
        RAISE NOTICE 'Added role check constraint';
    END IF;
END $$;

-- Step 5: Create index for role column
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

-- Step 6: Drop type column if it exists (CAREFUL: This will remove the old column)
-- Uncomment the following block ONLY if you're sure you want to remove the type column
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.messages DROP COLUMN type;
        RAISE NOTICE 'Dropped type column from messages table';
    END IF;
END $$;
*/

-- Step 7: Update RLS policies to use role column
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in shared conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.messages;

-- Recreate RLS policies with role column
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view messages in shared conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND is_shared = true
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in own conversations" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in own conversations" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- Step 8: Verify the final schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show any constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'messages' AND table_schema = 'public';

SELECT 'Schema migration completed successfully!' as status; 