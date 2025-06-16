-- Create missing tables for stream states and conversation branches

-- Create stream_states table
CREATE TABLE IF NOT EXISTS public.stream_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_branches table
CREATE TABLE IF NOT EXISTS public.conversation_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    branch_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stream_states_conversation_id ON public.stream_states(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_branches_conversation_id ON public.conversation_branches(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_branches_parent_message_id ON public.conversation_branches(parent_message_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.stream_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_branches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own stream states" ON public.stream_states
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own conversation branches" ON public.conversation_branches
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    ); 