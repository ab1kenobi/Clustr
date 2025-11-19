import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Bell, Filter, Plus, Zap, User } from "lucide-react-native";
import { EventCard } from "@/components/ui/EventCard";
import { PlatformFilters, PlatformType } from "@/components/ui/PlatformFilters";
//import { BottomTabNavigator } from "@/components/BottomTabNavigator";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/config/firebase"; // adjust path to your firebase.ts


interface Event {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
  platform: string;
  likes: number;
  rsvps: string; 
  tags?: string[];
}


const { width } = Dimensions.get("window");
const isTablet = width >= 768;
function parseEventDateTime(dateStr: string, timeStr: string) {
  try {
    // dateStr is like "2025-11-20"
    // timeStr is like "7:30 PM"
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const eventDate = new Date(dateStr);
    eventDate.setHours(hours, minutes, 0, 0);
    return eventDate;
  } catch {
    return null;
  }
}


export default function Discover() {
  const navigation = useNavigation();
  const router = useRouter(); 
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(6);
  const [showMyRsvps, setShowMyRsvps] = useState(false);
  const currentUid = auth.currentUser?.uid;
  const filteredEvents = events.filter((e) => {
    if (showMyRsvps && currentUid) {
      return e.rsvps?.includes(currentUid);
    }
    if (selectedPlatform === "all") return true;
    return e.tags?.some(
      (t) => t.toLowerCase() === selectedPlatform.toLowerCase()
    );
  });


  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      const upcoming = data.filter((e) => {
        if (!e.date || !e.time) return true; // keep if missing fields
        const eventDateTime = parseEventDateTime(e.date, e.time);
        return eventDateTime ? eventDateTime >= now : true;
      });

      setEvents(upcoming);
    });
    return unsubscribe;
  }, []);


  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + 3, filteredEvents.length));
  };

  const handleEventClick = (id: string) => {
    router.push(`/(tabs)/meetup/${id}` as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#F9FAFB", "#FFFFFF"]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {/* Fixed Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Header Top */}
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.title}>Clustr</Text>
                  <Text style={styles.subtitle}>Find your next adventure</Text>
                </View>

                {/* Header Actions */}
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                    onPress={() => setShowMyRsvps((prev) => !prev)} // toggle RSVP filter
                  >
                    <Filter size={20} color={showMyRsvps ? "#2563EB" : "#6B7280"} />
                    {showMyRsvps && <View style={styles.notificationDot} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                    onPress={() => router.push("/profile")} 
                  >
                    <User size={20} color="#6B7280" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    activeOpacity={0.8}
                    onPress={() => router.push("/create")} 
                  >
                    <LinearGradient
                      colors={["#3B82F6", "#2563EB"]}
                      style={styles.createButtonGradient}
                    >
                      <Plus size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Refresh Indicator */}
              {isRefreshing && (
                <View style={styles.refreshIndicator}>
                  <Zap size={16} color="#3B82F6" />
                  <Text style={styles.refreshText}>Refreshing events...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Platform Filters */}
          <PlatformFilters
            selectedPlatform={selectedPlatform}
            onFilterChange={setSelectedPlatform}
          />

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Empty State */}
            {filteredEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptyDescription}>
                  Try selecting a different platform or check back later
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedPlatform("all")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyButton}>View all events</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Events Grid */}
                <View style={[styles.eventsGrid, isTablet && styles.eventsGridTablet]}>
                  {filteredEvents.slice(0, displayedCount).map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.eventCardWrapper, isTablet && styles.eventCardWrapperTablet]}
                      onPress={() => handleEventClick(event.id)}
                      activeOpacity={0.9}
                    >
                      <EventCard
                        {...event}
                        onLearnMore={() => handleEventClick(event.id)}
                        attendees={event.rsvps?.length || 0}
                        onRSVP={() => console.log(`RSVP to ${event.title}`)}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Load More Button */}
                {displayedCount < filteredEvents.length && (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={handleLoadMore}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loadMoreText}>Load More Events</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* End of Results */}
                {displayedCount >= filteredEvents.length && filteredEvents.length > 0 && (
                  <View style={styles.endOfResults}>
                    <Text style={styles.endOfResultsTitle}>
                      You've reached the end of {selectedPlatform === "all" ? "all" : "this"} events
                    </Text>
                    <Text style={styles.endOfResultsSubtitle}>
                      Check back soon for new events
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Bottom Tab Navigator */}
        {/* <BottomTabNavigator /> */}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom navigator
  },
  header: {
    backgroundColor: "#FFFFFF", // clean white
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB", // subtle gray divider
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    maxWidth: 672, // 2xl equivalent
    marginHorizontal: "auto",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    width: "100%",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleGradient: {
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "transparent",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: "#EF4444",
    borderRadius: 4,
  },
  createButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  createButtonGradient: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
  },
  mainContent: {
    maxWidth: 672,
    marginHorizontal: "auto",
    paddingHorizontal: 16,
    paddingVertical: 24,
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  eventsGrid: {
    gap: 16,
  },
  eventsGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  eventCardWrapper: {
    width: "100%",
  },
  eventCardWrapperTablet: {
    width: "48%",
  },
  loadMoreContainer: {
    paddingTop: 16,
    alignItems: "center",
  },
  loadMoreButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  endOfResults: {
    alignItems: "center",
    paddingVertical: 32,
  },
  endOfResultsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  endOfResultsSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
});