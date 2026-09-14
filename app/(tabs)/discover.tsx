import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarPlus, Filter, Plus, Search, User, Zap } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { EventCard } from "@/components/ui/EventCard";
import { PlatformFilters, PlatformType } from "@/components/ui/PlatformFilters";
import { auth, db } from "@/config/firebase";
import { colors } from "@/styles/theme";
import { ensureUicCampusAccess } from "@/utils/campus-access";

interface Event {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
  attendeeCount?: number;
  attendeeIds?: string[];
  platform: string;
  likes: number;
  rsvps?: string[];
  tags?: string[];
  campus?: string;
  campusOnly?: boolean;
  creatorId?: string;
  createdAt?: { toMillis?: () => number } | null;
}

interface CurrentUser {
  campusAccess?: string[];
  campusVerified?: boolean;
  schoolEmailVerified?: boolean;
}

function parseEventDateTime(dateStr: string, timeStr: string) {
  try {
    const [time, modifier] = timeStr.split(" ");
    const [rawHours, rawMinutes] = time.split(":").map(Number);
    let hours = rawHours;
    const minutes = rawMinutes || 0;

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideLayout = Platform.OS === "web" && width >= 900;
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(6);
  const [showMyRsvps, setShowMyRsvps] = useState(false);
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);
  const [feedError, setFeedError] = useState("");
  const currentUid = auth.currentUser?.uid;
  const hasCampusAccess =
    currentUser?.campusAccess?.includes("UIC") ||
    currentUser?.campusVerified ||
    currentUser?.schoolEmailVerified;

  const filteredEvents = events.filter((event) => {
    if (event.campusOnly) {
      const allowedCampus = event.campus || "UIC";
      const hasCampusAccess =
        currentUser?.campusAccess?.includes(allowedCampus) ||
        currentUser?.campusVerified ||
        currentUser?.schoolEmailVerified;

      if (!hasCampusAccess) return false;
    }

    if (showMyEvents && currentUid) {
      return event.creatorId === currentUid;
    }

    if (showMyRsvps && currentUid) {
      const attendeeIds = event.attendeeIds || event.rsvps || [];
      return attendeeIds.includes(currentUid);
    }

    if (selectedPlatform === "all") return true;
    return event.tags?.some(
      (tag) => tag.toLowerCase() === selectedPlatform.toLowerCase()
    );
  });

  useEffect(() => {
    if (!currentUid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", currentUid),
      (snapshot) => {
        setCurrentUser(snapshot.exists() ? (snapshot.data() as CurrentUser) : null);
        setCurrentUserLoaded(true);
      },
      (error) => {
        console.error("Current user listener error:", error);
        setCurrentUser(null);
        setCurrentUserLoaded(true);
        setFeedError(error.message || "Could not load your campus profile.");
      }
    );

    return unsubscribe;
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    ensureUicCampusAccess().catch((error) => {
      console.warn("Campus access check failed:", error);
    });
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid || !currentUserLoaded) return;

    if (!hasCampusAccess) {
      setFeedError("UIC campus access is required to browse pilot events.");
      setEvents([]);
      return;
    }

    const eventsQuery = query(collection(db, "events"), where("campus", "==", "UIC"));
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const now = new Date();
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Event[];

        setFeedError("");
        setEvents(
          data
            .filter((event) => {
              if (!event.date || !event.time) return true;
              const eventDateTime = parseEventDateTime(event.date, event.time);
              return eventDateTime ? eventDateTime >= now : true;
            })
            .sort((a, b) => {
              const bTime = b.createdAt?.toMillis?.() || 0;
              const aTime = a.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            })
        );
      },
      (error) => {
        console.error("Events feed error:", error);
        setFeedError(error.message || "Could not load events.");
      }
    );

    return unsubscribe;
  }, [currentUid, currentUserLoaded, hasCampusAccess]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleEventClick = (id: string) => {
    router.push(`/(tabs)/meetup/${id}` as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.header}>
            <View
              style={[
                styles.headerContent,
                isWideLayout && styles.contentWide,
              ]}
            >
              <View style={{ height: Math.max(insets.top - 8, 0) }} />
              <View style={styles.headerTop}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Clustr</Text>
                  <Text style={styles.subtitle}>Campus plans that actually make it out of the group chat.</Text>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowMyRsvps((prev) => !prev);
                      setShowMyEvents(false);
                    }}
                  >
                    <Filter size={20} color={showMyRsvps ? colors.primary : colors.placeholder} />
                    {showMyRsvps ? <View style={styles.notificationDot} /> : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                    onPress={() => router.push("/profile" as any)}
                  >
                    <User size={20} color={colors.placeholder} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    activeOpacity={0.8}
                    onPress={() => router.push("/create" as any)}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.createButtonGradient}
                    >
                      <Plus size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {isRefreshing ? (
                <View style={styles.refreshIndicator}>
                  <Zap size={16} color={colors.primary} />
                  <Text style={styles.refreshText}>Refreshing events...</Text>
                </View>
              ) : null}
            </View>
          </View>

          <PlatformFilters
            selectedPlatform={selectedPlatform}
            onFilterChange={setSelectedPlatform}
          />

          <View style={[styles.mainContent, isWideLayout && styles.contentWide]}>
            <View style={styles.quickFilters}>
              <TouchableOpacity
                style={[
                  styles.quickFilter,
                  !showMyRsvps && !showMyEvents && styles.quickFilterActive,
                ]}
                onPress={() => {
                  setShowMyRsvps(false);
                  setShowMyEvents(false);
                }}
              >
                <Text
                  style={[
                    styles.quickFilterText,
                    !showMyRsvps && !showMyEvents && styles.quickFilterTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickFilter, showMyRsvps && styles.quickFilterActive]}
                onPress={() => {
                  setShowMyRsvps(true);
                  setShowMyEvents(false);
                }}
              >
                <Filter size={14} color={showMyRsvps ? "#fff" : colors.placeholder} />
                <Text style={[styles.quickFilterText, showMyRsvps && styles.quickFilterTextActive]}>
                  RSVPs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickFilter, showMyEvents && styles.quickFilterActive]}
                onPress={() => {
                  setShowMyEvents(true);
                  setShowMyRsvps(false);
                }}
              >
                <CalendarPlus size={14} color={showMyEvents ? "#fff" : colors.placeholder} />
                <Text style={[styles.quickFilterText, showMyEvents && styles.quickFilterTextActive]}>
                  Posted
                </Text>
              </TouchableOpacity>
            </View>

            {feedError ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Could not load events</Text>
                <Text style={styles.emptyDescription}>{feedError}</Text>
              </View>
            ) : filteredEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptyDescription}>
                  Try another category or check back when more campus events are posted.
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
                <View style={[styles.eventsGrid, isWideLayout && styles.eventsGridWide]}>
                  {filteredEvents.slice(0, displayedCount).map((event) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventCardWrapper,
                        isWideLayout && styles.eventCardWrapperWide,
                      ]}
                    >
                      <EventCard
                        {...event}
                        onLearnMore={() => handleEventClick(event.id)}
                        attendees={
                          event.attendeeCount ??
                          event.attendeeIds?.length ??
                          event.rsvps?.length ??
                          event.attendees ??
                          0
                        }
                        onRSVP={() => handleEventClick(event.id)}
                      />
                    </View>
                  ))}
                </View>

                {displayedCount < filteredEvents.length ? (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={() =>
                        setDisplayedCount((prev) => Math.min(prev + 3, filteredEvents.length))
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loadMoreText}>Load More Events</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerContent: {
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    width: "100%",
  },
  contentWide: {
    maxWidth: 960,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.inputText,
  },
  subtitle: {
    maxWidth: 260,
    fontSize: 13,
    color: colors.placeholder,
    marginTop: 4,
    lineHeight: 18,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    padding: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    backgroundColor: colors.primary,
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
  refreshIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  mainContent: {
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: "100%",
  },
  quickFilters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  quickFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickFilterText: {
    color: colors.placeholder,
    fontWeight: "700",
    fontSize: 13,
  },
  quickFilterTextActive: {
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 44,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.inputText,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.placeholder,
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 320,
    lineHeight: 20,
  },
  emptyButton: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  eventsGrid: {
    gap: 16,
  },
  eventsGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  eventCardWrapper: {
    width: "100%",
  },
  eventCardWrapperWide: {
    width: "48.8%",
  },
  loadMoreContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1.8,
    borderColor: colors.primary,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
});
