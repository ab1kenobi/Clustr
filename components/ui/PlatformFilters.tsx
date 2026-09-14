import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Laptop,
  Music,
  Palette,
  Sparkles,
  Trees,
  Users,
  Utensils,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/styles/theme";

export type PlatformType =
  | "all"
  | "Tech"
  | "Outdoors"
  | "Art"
  | "Food"
  | "Music"
  | "Networking"
  | "Education"
  | "Gaming"
  | "Fitness";

type FilterIcon = React.ComponentType<{ size?: number; color?: string }>;

interface PlatformOption {
  id: PlatformType;
  label: string;
  Icon: FilterIcon;
}

interface PlatformFiltersProps {
  onFilterChange?: (platform: PlatformType) => void;
  selectedPlatform?: PlatformType;
}

const PLATFORMS: PlatformOption[] = [
  { id: "all", label: "All Events", Icon: Sparkles },
  { id: "Tech", label: "Tech", Icon: Laptop },
  { id: "Outdoors", label: "Outdoors", Icon: Trees },
  { id: "Art", label: "Art", Icon: Palette },
  { id: "Food", label: "Food", Icon: Utensils },
  { id: "Music", label: "Music", Icon: Music },
  { id: "Networking", label: "Networking", Icon: Users },
  { id: "Education", label: "Education", Icon: GraduationCap },
  { id: "Gaming", label: "Gaming", Icon: Gamepad2 },
  { id: "Fitness", label: "Fitness", Icon: Dumbbell },
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
    scrollViewRef.current?.scrollTo({
      x: direction === "left" ? -200 : 200,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {canScrollLeft && (
          <View style={styles.leftButton}>
            <TouchableOpacity
              onPress={() => scroll("left")}
              style={styles.scrollButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={colors.placeholder} />
            </TouchableOpacity>
          </View>
        )}

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
            const Icon = platform.Icon;

            return (
              <TouchableOpacity
                key={platform.id}
                onPress={() => onFilterChange?.(platform.id)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterButtonSelected}
                  >
                    <Icon size={16} color="#FFFFFF" />
                    <Text style={styles.labelSelected}>{platform.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterButton}>
                    <Icon size={16} color={colors.accent} />
                    <Text style={styles.label}>{platform.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {canScrollRight && (
          <View style={styles.rightButton}>
            <TouchableOpacity
              onPress={() => scroll("right")}
              style={styles.scrollButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color={colors.placeholder} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wrapper: {
    maxWidth: 960,
    alignSelf: "center",
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
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inputText,
  },
  labelSelected: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
