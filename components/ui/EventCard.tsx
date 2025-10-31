import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Calendar, MapPin, Heart, Users, Share2, ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface EventCardProps {
  id: string;
  title: string;
  image?: string;
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

export function EventCard({
  id,
  title,
  image = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
  date,
  time,
  location,
  description,
  attendees,
  platform = "Meetup",
  likes = 0,
  onLearnMore,
  onRSVP,
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
    <View style={styles.card}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Platform Badge */}
        <View style={styles.platformBadge}>
          <View style={styles.platformDot} />
          <Text style={styles.platformText}>{platform}</Text>
        </View>

        {/* Quick Action - Like Button */}
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

      {/* Content Container */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Date & Time */}
        <View style={styles.infoRow}>
          <Calendar size={16} color="#3B82F6" />
          <Text style={styles.infoTextBold}>{date}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.infoText}>{time}</Text>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <MapPin size={16} color="#A855F7" />
          <Text style={styles.infoTextBold} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Engagement Stats */}
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
              <Users size={16} color="#10B981" />
              <Text style={styles.statText}>{attendees}</Text>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Share2 size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={() => onLearnMore?.()}
          style={styles.ctaButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Learn More</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imageContainer: {
    width: "100%",
    height: 192,
    backgroundColor: "#F3F4F6",
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
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  platformText: {
    fontSize: 12,
    fontWeight: "600",
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
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
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
    fontWeight: "500",
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
    fontWeight: "600",
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
    fontWeight: "600",
    color: "#FFFFFF",
  },
});