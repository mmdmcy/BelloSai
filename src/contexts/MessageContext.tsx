import { createContext, useState, useEffect, useContext, useCallback, Dispatch, SetStateAction, FC, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { sendChatMessage } from '../lib/supabase-chat';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  isResolving?: boolean;
  conversationId?: string;
  error?: string;
  isOptimistic?: boolean;
}

interface Conversation {
    id: string;
    title: string;
    created_at: string;
}

interface MessageContextType {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  activeConversationId: string | null;
  setActiveConversationId: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
  isCreatingConversation: boolean;
  sendMessage: (message: string, model: string) => Promise<void>;
  handleNewConversation: (title?: string) => Promise<Conversation | undefined>;
  searchResults: any[];
  setSearchResults: Dispatch<SetStateAction<any[]>>;
  searchConversations: (searchTerm: string) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setConversations(data);
    }
  };

  const handleNewConversation = useCallback(async (title: string = "New Conversation"): Promise<Conversation | undefined> => {
    if (isCreatingConversation) return;

    if (!user) {
      const localConversation: Conversation = {
        id: `local-${Date.now()}`,
        title,
        created_at: new Date().toISOString()
      };
      setConversations(prev => [localConversation, ...prev]);
      setActiveConversationId(localConversation.id);
      setMessages([]);
      return localConversation;
    }

    setIsCreatingConversation(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title })
        .select('id, title, created_at')
        .single();

      if (error) throw error;
      
      if (data) {
        setConversations(prev => [data, ...prev]);
        setActiveConversationId(data.id);
        setMessages([]);
        return data;
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, user]);

  const sendMessage = useCallback(async (message: string, currentModel: string) => {
    if (!message.trim()) return;

    let conversationIdToUse = activeConversationId;
    if (!conversationIdToUse) {
        const newConversation = await handleNewConversation(message.substring(0,30));
        if(newConversation) {
          conversationIdToUse = newConversation.id;
        }
    }

    if (!conversationIdToUse) {
      console.error("Failed to create or retrieve a conversation ID.");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      isResolving: false,
      conversationId: conversationIdToUse,
      isOptimistic: true
    };

    setMessages(prev => [...prev, userMessage]);

    const chatMessagesForApi = messages
      .filter(msg => msg.content.trim() !== '')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    try {
      setIsLoading(true);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: '',
        isResolving: true,
        conversationId: conversationIdToUse
      };
      setMessages(prev => [...prev, aiMessage]);

      const stream = await sendChatMessage(
        [...chatMessagesForApi, { role: 'user', content: message }],
        currentModel,
        (chunk) => {
            setMessages(prev => prev.map(msg =>
                msg.id === aiMessage.id
                  ? { ...msg, content: msg.content + chunk, isResolving: true }
                  : msg
              ));
        },
        conversationIdToUse
      );

      setMessages(prev => prev.map(msg =>
        msg.id === aiMessage.id
          ? { ...msg, isResolving: false }
          : msg
      ));
      
      const shouldPersist = !!user && !conversationIdToUse.startsWith('local-');
      if (shouldPersist) {
        await supabase.from('messages').upsert([
          { conversation_id: conversationIdToUse, role: 'user', content: message },
          { conversation_id: conversationIdToUse, role: 'assistant', content: stream }
        ]);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id.startsWith('ai-') && msg.isResolving
          ? { ...msg, content: `Error: ${error.message}`, isResolving: false, error: error.message }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages, activeConversationId, user, handleNewConversation]);

  const searchConversations = (searchTerm: string) => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    const results = conversations.filter(c =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  return (
    <MessageContext.Provider value={{
      messages,
      setMessages,
      conversations,
      setConversations,
      activeConversationId,
      setActiveConversationId,
      isLoading,
      isCreatingConversation,
      sendMessage,
      handleNewConversation,
      searchResults,
      setSearchResults,
      searchConversations
    }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};
