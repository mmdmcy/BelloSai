-- Advanced Chat Features Migration
-- Adds support for:
-- - Chat branching and alternative conversation paths
-- - Chat sharing with public links
-- - Resumable streams and conversation persistence
-- - User API keys (BYOK)
-- - Web search integration
-- - Image generation capabilities

-- Conversation branches table
CREATE TABLE IF NOT EXISTS public.conversation_branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream states table for resumable streams
CREATE TABLE IF NOT EXISTS public.stream_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    partial_content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, message_id)
);

-- User API keys table (encrypted storage)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    openai_key TEXT,
    anthropic_key TEXT,
    deepseek_key TEXT,
    google_key TEXT,
    encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing tables
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.conversation_branches(id);

ALTER TABLE public.attachments 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_branches_conversation_id ON public.conversation_branches(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_branches_parent_message_id ON public.conversation_branches(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_stream_states_conversation_id ON public.stream_states(conversation_id);
CREATE INDEX IF NOT EXISTS idx_stream_states_message_id ON public.stream_states(message_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_branch_id ON public.messages(branch_id);
CREATE INDEX IF NOT EXISTS idx_conversations_expires_at ON public.conversations(expires_at);

-- Row Level Security (RLS) Policies

-- Conversation branches policies
CREATE POLICY "Users can view branches in own conversations" ON public.conversation_branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create branches in own conversations" ON public.conversation_branches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update branches in own conversations" ON public.conversation_branches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete branches in own conversations" ON public.conversation_branches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- Stream states policies
CREATE POLICY "Users can view stream states in own conversations" ON public.stream_states
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage stream states in own conversations" ON public.stream_states
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- User API keys policies
CREATE POLICY "Users can view own API keys" ON public.user_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Functions

-- Function to increment share view count
CREATE OR REPLACE FUNCTION public.increment_share_view_count(share_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.conversations 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE share_id = $1 AND is_shared = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired shared conversations
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS VOID AS $$
BEGIN
    UPDATE public.conversations 
    SET is_shared = FALSE, share_id = NULL, expires_at = NULL
    WHERE is_shared = TRUE 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old stream states (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_stream_states()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.stream_states 
    WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's updated_at timestamp for API keys
CREATE OR REPLACE FUNCTION public.update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user API keys updated_at
CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON public.user_api_keys
    FOR EACH ROW EXECUTE FUNCTION public.update_user_api_keys_updated_at();

-- Enable RLS on new tables
ALTER TABLE public.conversation_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
