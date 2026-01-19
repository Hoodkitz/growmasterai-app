import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Image, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { useAppAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
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





export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();

  const { user } = useAppAuth();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const messagesQuery = trpc.messages.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5s for new messages
  });

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      messagesQuery.refetch();
    },
  });

  useFocusEffect(
    useCallback(() => {
      messagesQuery.refetch();
    }, [])
  );

  // Group messages into conversations
  const conversations: Conversation[] = [];
  const conversationMessages: Record<string, Message[]> = {};

  if (messagesQuery.data && user) {
    const sortedMessages = [...messagesQuery.data].sort((a, b) =>
      new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime()
    );

    sortedMessages.forEach(({ message, sender, receiver }) => {
      // Handle potential null users (e.g. deleted accounts)
      if (!sender || !receiver) return;

      const isMe = sender.openId === user.id;
      const otherUser = isMe ? receiver : sender;
      const otherUserId = otherUser.id.toString(); // Use int ID as string key

      if (!conversationMessages[otherUserId]) {
        conversationMessages[otherUserId] = [];

        conversations.push({
          id: otherUserId,
          participantId: otherUserId,
          participantName: otherUser.name || "Unknown",
          participantAvatar: otherUser.avatarUrl || "👤",
          participantLevel: 1, // Need to add level to user query if needed
          lastMessage: message.content,
          lastMessageTime: new Date(message.createdAt),
          unreadCount: (!message.isRead && !isMe) ? 1 : 0,
          online: false, // Need online status system
        });
      } else {
        const conv = conversations.find(c => c.id === otherUserId);
        if (conv) {
          conv.lastMessage = message.content;
          conv.lastMessageTime = new Date(message.createdAt);
          if (!message.isRead && !isMe) conv.unreadCount++;
        }
      }

      conversationMessages[otherUserId].push({
        id: message.id.toString(),
        senderId: isMe ? "me" : otherUser.id.toString(),
        text: message.content,
        timestamp: new Date(message.createdAt),
      });
    });
  }

  // Sort conversations by last message
  conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

  const currentMessages = selectedConversation
    ? conversationMessages[selectedConversation.id] || []
    : [];

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
    if (!newMessage.trim() || !selectedConversation) return;

    // Optimistic update could go here

    sendMutation.mutate({
      receiverId: parseInt(selectedConversation.id),
      content: newMessage,
    });
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
          data={currentMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          inverted={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === "me";
            return (
              <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                <View
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe ? 'bg-primary rounded-br-sm' : 'bg-surface border border-border rounded-bl-sm'
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
