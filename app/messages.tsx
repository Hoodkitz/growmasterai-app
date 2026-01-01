import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Image, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantLevel: number;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  online: boolean;
}

// Mock data
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    participantId: "user1",
    participantName: "GreenThumb420",
    participantAvatar: "🌿",
    participantLevel: 12,
    lastMessage: "Hey, wie läuft dein Grow?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    online: true,
  },
  {
    id: "2",
    participantId: "user2",
    participantName: "CannabisMaster",
    participantAvatar: "🌱",
    participantLevel: 25,
    lastMessage: "Die Tipps haben super geholfen, danke!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 0,
    online: false,
  },
  {
    id: "3",
    participantId: "user3",
    participantName: "OrganicGrower",
    participantAvatar: "🍃",
    participantLevel: 8,
    lastMessage: "Welchen Dünger verwendest du?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    online: true,
  },
];

const MOCK_MESSAGES: Message[] = [
  { id: "1", senderId: "user1", text: "Hey! Ich hab gesehen, dass du auch mit Northern Lights arbeitest.", timestamp: new Date(Date.now() - 1000 * 60 * 30), read: true },
  { id: "2", senderId: "me", text: "Ja genau! Bin in Woche 4 der Blüte jetzt.", timestamp: new Date(Date.now() - 1000 * 60 * 25), read: true },
  { id: "3", senderId: "user1", text: "Nice! Wie sind die Trichome? Hast du schon gecheckt?", timestamp: new Date(Date.now() - 1000 * 60 * 20), read: true },
  { id: "4", senderId: "me", text: "Noch hauptsächlich klar, aber ein paar werden schon milchig.", timestamp: new Date(Date.now() - 1000 * 60 * 15), read: true },
  { id: "5", senderId: "user1", text: "Perfekt! Noch 2-3 Wochen würde ich sagen.", timestamp: new Date(Date.now() - 1000 * 60 * 10), read: true },
  { id: "6", senderId: "user1", text: "Hey, wie läuft dein Grow?", timestamp: new Date(Date.now() - 1000 * 60 * 5), read: false },
];

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

  const isPremium = tier !== "free";

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: newMessage,
      timestamp: new Date(),
      read: true,
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  // Conversation List View
  if (!selectedConversation) {
    return (
      <ScreenContainer>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Nachrichten</Text>
          <TouchableOpacity className="p-2 -mr-2">
            <IconSymbol name="square.and.pencil" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {!isPremium ? (
          <View className="flex-1 items-center justify-center p-6">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
              <IconSymbol name="lock.fill" size={40} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">Premium Feature</Text>
            <Text className="text-base text-muted text-center mb-6">
              Direktnachrichten sind nur für Premium und Pro Mitglieder verfügbar.
            </Text>
            <TouchableOpacity 
              className="bg-primary px-6 py-3 rounded-full"
              onPress={() => router.push("/paywall")}
            >
              <Text className="text-base font-semibold text-white">Upgrade auf Premium</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-3"
                onPress={() => setSelectedConversation(item)}
              >
                <View className="relative">
                  <View className="w-14 h-14 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-2xl">{item.participantAvatar}</Text>
                  </View>
                  {item.online && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-success border-2 border-surface" />
                  )}
                </View>
                
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-foreground">{item.participantName}</Text>
                    <View className="bg-primary/20 px-2 py-0.5 rounded">
                      <Text className="text-xs text-primary">Lvl {item.participantLevel}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted" numberOfLines={1}>{item.lastMessage}</Text>
                </View>
                
                <View className="items-end gap-1">
                  <Text className="text-xs text-muted">{formatTime(item.lastMessageTime)}</Text>
                  {item.unreadCount > 0 && (
                    <View className="bg-primary w-5 h-5 rounded-full items-center justify-center">
                      <Text className="text-xs font-bold text-white">{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-4xl mb-4">💬</Text>
                <Text className="text-base text-muted text-center">Noch keine Nachrichten</Text>
                <Text className="text-sm text-muted text-center mt-1">
                  Starte eine Unterhaltung mit anderen Growern!
                </Text>
              </View>
            }
          />
        )}
      </ScreenContainer>
    );
  }

  // Chat View
  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Chat Header */}
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          
          <View className="relative">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
              <Text className="text-lg">{selectedConversation.participantAvatar}</Text>
            </View>
            {selectedConversation.online && (
              <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{selectedConversation.participantName}</Text>
            <Text className="text-xs text-muted">
              {selectedConversation.online ? "Online" : "Offline"}
            </Text>
          </View>
          
          <TouchableOpacity className="p-2">
            <IconSymbol name="ellipsis" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          inverted={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === "me";
            return (
              <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                <View 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMe ? 'bg-primary rounded-br-sm' : 'bg-surface border border-border rounded-bl-sm'
                  }`}
                >
                  <Text className={`text-base ${isMe ? 'text-white' : 'text-foreground'}`}>
                    {item.text}
                  </Text>
                </View>
                <Text className="text-xs text-muted mt-1">
                  {item.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />

        {/* Message Input */}
        <View className="flex-row items-center gap-2 px-4 py-3 border-t border-border bg-background">
          <TouchableOpacity className="p-2">
            <IconSymbol name="camera.fill" size={24} color={colors.muted} />
          </TouchableOpacity>
          
          <View className="flex-1 bg-surface rounded-full px-4 py-2 border border-border">
            <TextInput
              className="text-base text-foreground"
              placeholder="Nachricht schreiben..."
              placeholderTextColor={colors.muted}
              value={newMessage}
              onChangeText={setNewMessage}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
          </View>
          
          <TouchableOpacity 
            className={`p-2 rounded-full ${newMessage.trim() ? 'bg-primary' : 'bg-surface'}`}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <IconSymbol name="paperplane.fill" size={20} color={newMessage.trim() ? "#fff" : colors.muted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
