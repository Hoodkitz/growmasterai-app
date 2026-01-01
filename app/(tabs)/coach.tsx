import { useState, useRef } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tips?: string[];
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
    onError: (error) => {
      console.error("Coach error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Frage. Bitte versuche es erneut.",
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || coachMutation.isPending) return;

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
        </View>

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
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
