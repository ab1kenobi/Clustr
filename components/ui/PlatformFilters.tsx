import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export type PlatformType = "all" | "meetup" | "eventbrite" | "facebook" | "lunchclub" | "bumble";

interface PlatformOption {
  id: PlatformType;
  label: string;
  icon: string;
  color: string[];
}

interface PlatformFiltersProps {
  onFilterChange?: (platform: PlatformType) => void;
  selectedPlatform?: PlatformType;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: "all",
    label: "All Events",
    icon: "🌐",
    color: ["#9CA3AF", "#4B5563"],
  },
  {
    id: "meetup",
    label: "Meetup",
    icon: "👥",
    color: ["#60A5FA", "#2563EB"],
  },
  {
    id: "eventbrite",
    label: "Eventbrite",
    icon: "🎟️",
    color: ["#C084FC", "#9333EA"],
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "f",
    color: ["#2563EB", "#1E40AF"],
  },
  {
    id: "lunchclub",
    label: "Lunchclub",
    icon: "🍽️",
    color: ["#FB923C", "#EA580C"],
  },
  {
    id: "bumble",
    label: "Bumble BFF",
    icon: "👋",
    color: ["#FBBF24", "#D97706"],
  },
];

export function PlatformFilters({
  onFilterChange,
  selectedPlatform = "all",
}: PlatformFiltersProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setCanScrollLeft(contentOffset.x > 0);
    setCanScrollRight(
      contentOffset.x < contentSize.width - layoutMeasurement.width - 10
    );
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollViewRef.current) {
      const scrollAmount = 200;
      scrollViewRef.current.scrollTo({
        x: direction === "left" ? -scrollAmount : scrollAmount,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <View style={styles.leftButton}>
            <TouchableOpacity
              onPress={() => scroll("left")}
              style={styles.scrollButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Scrollable Container */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {PLATFORMS.map((platform) => {
            const isSelected = selectedPlatform === platform.id;
            
            return (
              <TouchableOpacity
                key={platform.id}
                onPress={() => onFilterChange?.(platform.id)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors= {["#2563EB", "#1E40AF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterButtonSelected}
                  >
                    <Text style={styles.icon}>{platform.icon}</Text>
                    <Text style={styles.labelSelected}>{platform.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterButton}>
                    <Text style={styles.icon}>{platform.icon}</Text>
                    <Text style={styles.label}>{platform.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <View style={styles.rightButton}>
            <TouchableOpacity
              onPress={() => scroll("right")}
              style={styles.scrollButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  wrapper: {
    maxWidth: 672,
    marginHorizontal: "auto",
    position: "relative",
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
  },
  leftButton: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
    paddingLeft: 8,
  },
  rightButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
    paddingRight: 8,
  },
  scrollButton: {
    padding: 8,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#F3F4F6",
  },
  filterButtonSelected: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  icon: {
    marginRight: 8,
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  labelSelected: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});