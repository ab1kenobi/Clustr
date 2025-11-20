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
                  <Text style={styles.subtitle}>Join Your Clustr!</Text>
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
    backgroundColor: "#F5F6FA",
  },

  gradient: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 80,
  },

  // HEADER
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  headerContent: {
    maxWidth: 680,
    marginHorizontal: "auto",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    width: "100%",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  subtitle: {
    fontSize: 14,
    color: "#585858",
    marginTop: 4,
  },

  // HEADER ACTION BUTTONS
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    padding: 8,
    backgroundColor: "#EFEFF3",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7D7DB",
  },

  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    backgroundColor: "#E44545",
    borderRadius: 4,
  },

  createButton: {
    borderRadius: 8,
    overflow: "hidden",
  },

  createButtonGradient: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  // REFRESH INDICATOR
  refreshIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  refreshText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3D63DD",
  },

  // MAIN CONTENT
  mainContent: {
    maxWidth: 680,
    marginHorizontal: "auto",
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: "100%",
  },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },

  emptyDescription: {
    fontSize: 15,
    color: "#6A6A6A",
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 300,
    lineHeight: 20,
  },

  emptyButton: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3D63DD",
  },

  // EVENT GRID
  eventsGrid: {
    gap: 16,
  },

  eventsGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  eventCardWrapper: {
    width: "100%",
  },

  eventCardWrapperTablet: {
    width: "48%",
  },

  // LOAD MORE
  loadMoreContainer: {
    marginTop: 20,
    alignItems: "center",
  },

  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.8,
    borderColor: "#3D63DD",
  },

  loadMoreText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3D63DD",
  },

  // END OF RESULTS
  endOfResults: {
    alignItems: "center",
    paddingVertical: 28,
  },

  endOfResultsTitle: {
    fontSize: 15,
    color: "#777",
  },

  endOfResultsSubtitle: {
    fontSize: 13,
    color: "#9A9A9A",
    marginTop: 4,
  },
});

