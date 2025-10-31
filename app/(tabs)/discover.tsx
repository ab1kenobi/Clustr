import React, { useState, useRef } from "react";
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
import { Bell, Filter, Plus, Zap } from "lucide-react-native";
import { EventCard } from "@/components/ui/EventCard";
import { PlatformFilters, PlatformType } from "@/components/ui/PlatformFilters";
//import { BottomTabNavigator } from "@/components/BottomTabNavigator";
import { LinearGradient } from "expo-linear-gradient";

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
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: "1",
    title: "Morning Yoga in the Park",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=300&fit=crop",
    date: "Tomorrow",
    time: "7:00 AM",
    location: "Central Park, NYC",
    description: "Start your day with a refreshing yoga session in nature. All levels welcome.",
    attendees: 12,
    platform: "Meetup",
    likes: 24,
  },
  {
    id: "2",
    title: "Tech Startup Networking Happy Hour",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
    date: "Wednesday",
    time: "6:00 PM",
    location: "Downtown Coffee Co, NYC",
    description: "Connect with founders and tech enthusiasts. Free drinks for first 50 attendees!",
    attendees: 28,
    platform: "Eventbrite",
    likes: 45,
  },
  {
    id: "3",
    title: "Canvas Painting Workshop for Beginners",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop",
    date: "Saturday",
    time: "2:00 PM",
    location: "Art Studio Brooklyn, NY",
    description: "Create your first masterpiece with our experienced instructors. Materials included.",
    attendees: 8,
    platform: "Facebook",
    likes: 18,
  },
  {
    id: "4",
    title: "Soccer Game & Social Drinks",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=300&fit=crop",
    date: "Sunday",
    time: "4:00 PM",
    location: "Field on 5th Ave, NYC",
    description: "Friendly soccer match followed by drinks. Skill level: all. Team formation on arrival.",
    attendees: 15,
    platform: "Meetup",
    likes: 32,
  },
  {
    id: "5",
    title: "Jazz Night at The Blue Note",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop",
    date: "Friday",
    time: "8:00 PM",
    location: "The Blue Note, NYC",
    description: "Live jazz performance with local musicians. Two-drink minimum.",
    attendees: 42,
    platform: "Eventbrite",
    likes: 67,
  },
  {
    id: "6",
    title: "Web Development Bootcamp - Free Intro Class",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
    date: "Thursday",
    time: "7:00 PM",
    location: "Virtual",
    description: "Learn HTML, CSS, and JavaScript basics. Perfect for beginners. No experience needed.",
    attendees: 35,
    platform: "Lunchclub",
    likes: 28,
  },
  {
    id: "7",
    title: "Plant Parent Meetup - Care Tips & Swaps",
    image: "https://images.unsplash.com/photo-1585071324498-3d271d78a733?w=500&h=300&fit=crop",
    date: "Monday",
    time: "6:30 PM",
    location: "Community Garden, NYC",
    description: "Share plant care tips, bring a plant to swap, and meet fellow plant enthusiasts.",
    attendees: 22,
    platform: "Bumble",
    likes: 41,
  },
];

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function Discover() {
  const navigation = useNavigation();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("all");
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(6);

  // Filter events based on selected platform
  const filteredEvents =
    selectedPlatform === "all"
      ? events
      : events.filter((e) => e.platform.toLowerCase() === selectedPlatform);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setEvents(SAMPLE_EVENTS);
      setDisplayedCount(6);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + 3, filteredEvents.length));
  };

  const handleEventClick = (eventId: string) => {
    navigation.navigate("MeetupDetail" as never);
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
                  <LinearGradient
                    colors={["#2563EB", "#9333EA"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleGradient}
                  >
                    <Text style={styles.title}>Discover</Text>
                  </LinearGradient>
                  <Text style={styles.subtitle}>Find your next adventure</Text>
                </View>

                {/* Header Actions */}
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <Bell size={20} color="#6B7280" />
                    <View style={styles.notificationDot} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <Filter size={20} color="#6B7280" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("CreateMeetup" as never)}
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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