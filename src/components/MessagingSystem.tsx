import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle, Clock, CheckCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: 'guest' | 'hotel' | 'admin';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface MessagingSystemProps {
  bookingId: string;
  className?: string;
}

export const MessagingSystem = ({ bookingId, className }: MessagingSystemProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookingId) {
      fetchMessages();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `booking_id=eq.${bookingId}`
          }, 
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('realtime-messaging', {
        body: {
          action: 'get_messages',
          bookingId
        }
      });

      if (error) throw error;
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('realtime-messaging', {
        body: {
          action: 'send_message',
          bookingId,
          message: newMessage.trim(),
          messageType: 'text'
        }
      });

      if (error) throw error;
      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'guest': return 'You';
      case 'hotel': return 'Hotel Staff';
      case 'admin': return 'Support';
      default: return 'System';
    }
  };

  const getSenderAvatar = (senderType: string) => {
    switch (senderType) {
      case 'guest': return 'YU';
      case 'hotel': return 'HS';
      case 'admin': return 'AD';
      default: return 'SY';
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-background to-muted/20 border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <MessageCircle className="h-5 w-5" />
          Booking Messages
          {messages.filter(m => !m.is_read && m.sender_id !== user?.id).length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {messages.filter(m => !m.is_read && m.sender_id !== user?.id).length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-64 w-full rounded-md border border-border/50 p-4 bg-muted/10"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with the hotel</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs ${
                      message.sender_type === 'guest' 
                        ? 'bg-primary/10 text-primary'
                        : message.sender_type === 'hotel'
                        ? 'bg-hotel-luxury/10 text-hotel-luxury'
                        : 'bg-secondary/10 text-secondary'
                    }`}>
                      {getSenderAvatar(message.sender_type)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[80%] ${
                    message.sender_id === user?.id ? 'text-right' : 'text-left'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {getSenderName(message.sender_type)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(message.created_at)}
                      </span>
                      {message.sender_id === user?.id && message.is_read && (
                        <CheckCheck className="h-3 w-3 text-success" />
                      )}
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : message.sender_type === 'hotel'
                        ? 'bg-hotel-luxury/10 text-hotel-luxury border border-hotel-luxury/20'
                        : message.sender_type === 'admin'
                        ? 'bg-secondary/10 text-secondary border border-secondary/20'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending}
            className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Messages are monitored by hotel staff for quality and safety
        </div>
      </CardContent>
    </Card>
  );
};