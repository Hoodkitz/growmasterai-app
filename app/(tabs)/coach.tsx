import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useSubscription } from "@/lib/subscription-context";
import { UpgradePrompt, UsageIndicator } from "@/components/upgrade-prompt";
import { TIER_LIMITS } from "@/lib/subscription";
import { InlineError } from "@/components/error-display";
import { getCoachErrorMessage } from "@/lib/error-handling";

const COACH_STORAGE_KEY = "@growmaster_coach_messages";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  tips?: string[];
  error?: ReturnType<typeof getCoachErrorMessage>;
  retryQuestion?: string;
}

export default function CoachScreen() {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo! Ich bin dein Grow Coach. Stelle mir Fragen zu deinem Cannabis-Anbau und ich helfe dir mit Tipps und Ratschlägen.",
    }
  ]);
  const [input, setInput] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Restore saved conversation
  useEffect(() => {
    AsyncStorage.getItem(COACH_STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
        }
      })
      .catch((e) => console.error("Failed to load coach history:", e))
      .finally(() => setHistoryLoaded(true));
  }, []);

  // Persist conversation (last 100 messages)
  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(messages.slice(-100))).catch((e) =>
      console.error("Failed to save coach history:", e),
    );
  }, [messages, historyLoaded]);

  const { tier, dailyMessages, canMessage, useMessage: consumeMessage, remainingMessages } = useSubscription();
  const limits = TIER_LIMITS[tier];

  const coachMutation = trpc.coach.ask.useMutation({
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        tips: data.tips,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (error, variables) => {
      console.error("Coach error:", error);
      const errorDetails = getCoachErrorMessage(error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "error",
        content: errorDetails.message,
        error: errorDetails,
        retryQuestion: variables.question,
      };
      setMessages(prev => [...prev, errorMessage]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || coachMutation.isPending) return;

    // Check if user can send message
    const canSend = await consumeMessage();
    if (!canSend) {
      return; // Limit reached
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = input.trim();
    setInput("");

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    coachMutation.mutate({ question });
  };

  const retryMessage = (messageId: string, question: string) => {
    // Remove the error message
    setMessages(prev => prev.filter(m => m.id !== messageId));
    
    // Retry the question
    coachMutation.mutate({ question });
  };

  const canSendMessage = canMessage();

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View className="p-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">Grow Coach</Text>
          <Text className="text-base text-muted">Dein persönlicher Anbau-Experte</Text>
          
          {/* Usage Indicator */}
          {limits.coachMessagesPerDay !== -1 && (
            <View className="mt-3">
              <UsageIndicator 
                used={dailyMessages} 
                limit={limits.coachMessagesPerDay} 
                label="Nachrichten heute"
              />
            </View>
          )}
        </View>

        {/* Limit Reached Warning */}
        {!canSendMessage && (
          <View className="p-4">
            <UpgradePrompt 
              feature="Nachrichten" 
              limit={limits.coachMessagesPerDay}
              remaining={remainingMessages}
            />
          </View>
        )}

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View 
              key={message.id}
              className={`max-w-[85%] ${message.role === "user" ? "self-end" : "self-start"}`}
            >
              <View 
                className={`rounded-2xl p-4 ${
                  message.role === "user" 
                    ? "bg-primary rounded-br-sm" 
                    : "bg-surface border border-border rounded-bl-sm"
                }`}
              >
                <Text className={`text-base ${message.role === "user" ? "text-background" : "text-foreground"}`}>
                  {message.content}
                </Text>
              </View>
              
              {message.tips && message.tips.length > 0 && (
                <View className="mt-2 bg-primary/10 rounded-xl p-3 gap-2">
                  <Text className="text-sm font-semibold text-primary">Praktische Tipps:</Text>
                  {message.tips.map((tip, index) => (
                    <View key={index} className="flex-row items-start gap-2">
                      <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                      <Text className="flex-1 text-sm text-foreground">{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          {coachMutation.isPending && (
            <View className="self-start bg-surface border border-border rounded-2xl rounded-bl-sm p-4">
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="p-4 border-t border-border bg-background">
          {!canSendMessage ? (
            <UpgradePrompt feature="Nachrichten" compact />
          ) : (
            <View className="flex-row gap-3 items-end">
              <TextInput
                className="flex-1 bg-surface rounded-2xl px-4 py-3 text-foreground border border-border min-h-[48px] max-h-[120px]"
                placeholder="Stelle eine Frage..."
                placeholderTextColor={colors.muted}
                value={input}
                onChangeText={setInput}
                multiline
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity 
                className={`w-12 h-12 rounded-full items-center justify-center ${input.trim() ? 'bg-primary' : 'bg-muted/30'}`}
                onPress={sendMessage}
                disabled={!input.trim() || coachMutation.isPending}
              >
                <IconSymbol name="paperplane.fill" size={20} color={input.trim() ? "#fff" : colors.muted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
