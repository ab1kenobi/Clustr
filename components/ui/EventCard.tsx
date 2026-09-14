import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Calendar, MapPin, Heart, Users, Share2, ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SmartImage } from "@/components/ui/smart-image";
import { colors } from "@/styles/theme";

interface EventCardProps {
  id: string;
  title: string;
  image?: string | null;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
  platform?: string;
  likes?: number;
  onLearnMore?: () => void;
  onRSVP?: () => void;
}

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900&h=600&fit=crop";

export function EventCard({
  title,
  image,
  date,
  time,
  location,
  description,
  attendees,
  platform = "UIC",
  likes = 0,
  onLearnMore,
}: EventCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleShare = () => {
    console.log(`Sharing event: ${title}`);
  };

  return (
    <Pressable style={styles.card} onPress={onLearnMore}>
      <View style={styles.imageContainer}>
        <SmartImage uri={image || DEFAULT_EVENT_IMAGE} style={styles.image} />

        <View style={styles.platformBadge}>
          <View style={styles.platformDot} />
          <Text style={styles.platformText}>{platform}</Text>
        </View>

        <TouchableOpacity
          onPress={handleLike}
          style={styles.likeButton}
          activeOpacity={0.7}
        >
          <Heart
            size={20}
            color={isLiked ? "#EF4444" : "#6B7280"}
            fill={isLiked ? "#EF4444" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.infoRow}>
          <Calendar size={16} color={colors.primary} />
          <Text style={styles.infoTextBold}>{date}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.infoText}>{time}</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color={colors.accent} />
          <Text style={styles.infoTextBold} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.stats}>
            <TouchableOpacity
              onPress={handleLike}
              style={styles.statButton}
              activeOpacity={0.7}
            >
              <Heart
                size={16}
                color={isLiked ? "#EF4444" : "#6B7280"}
                fill={isLiked ? "#EF4444" : "transparent"}
              />
              <Text style={styles.statText}>{likeCount}</Text>
            </TouchableOpacity>

            <View style={styles.statButton}>
              <Users size={16} color={colors.success} />
              <Text style={styles.statText}>{attendees}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Share2 size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => onLearnMore?.()}
          style={styles.ctaButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Learn More</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imageContainer: {
    width: "100%",
    height: 192,
    backgroundColor: colors.primaryLight,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  platformBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  platformText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  likeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTextBold: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  separator: {
    fontSize: 14,
    color: "#D1D5DB",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
  },
  ctaButton: {
    marginTop: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
