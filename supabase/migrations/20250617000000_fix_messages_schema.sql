-- Fix Messages Schema Migration
-- This migration ensures the messages table uses 'role' column consistently
-- and removes the 'type' column to avoid confusion

-- First, check if we need to migrate data from 'type' to 'role'
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
        
        -- Migrate data from type to role if type column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'type' 
            AND table_schema = 'public'
        ) THEN
            -- Convert 'ai' to 'assistant' and keep 'user' as is
            UPDATE public.messages 
            SET role = CASE 
                WHEN type = 'ai' THEN 'assistant'
                WHEN type = 'user' THEN 'user'
                ELSE 'user' -- fallback
            END;
        END IF;
        
        -- Make role column NOT NULL with constraint
        ALTER TABLE public.messages 
        ALTER COLUMN role SET NOT NULL,
        ADD CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant'));
        
        RAISE NOTICE 'Added role column to messages table';
    END IF;
    
    -- Drop type column if it exists (after data migration)
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

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

-- Update the database types enum if it exists
DO $$
BEGIN
    -- Drop the old message_type enum if it exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        DROP TYPE message_type CASCADE;
        RAISE NOTICE 'Dropped message_type enum';
    END IF;
END $$;

-- Update RLS policies to use role column
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in shared conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.messages;

-- Recreate RLS policies
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