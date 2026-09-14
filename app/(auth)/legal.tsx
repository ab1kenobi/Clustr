import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { colors } from "@/styles/theme";

export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: "terms" | "privacy" }>();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(type || "terms");

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.inputText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "terms" && styles.activeTab]}
          onPress={() => setActiveTab("terms")}
        >
          <Text style={[styles.tabText, activeTab === "terms" && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "privacy" && styles.activeTab]}
          onPress={() => setActiveTab("privacy")}
        >
          <Text style={[styles.tabText, activeTab === "privacy" && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {activeTab === "terms" ? <TermsOfService /> : <PrivacyPolicy />}
      </ScrollView>
    </View>
  );
}

function TermsOfService() {
  return (
    <View style={styles.document}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.updated}>Last Updated: January 2025</Text>

      <Section title="1. Agreement to Terms">
        <Text style={styles.text}>
          By accessing or using Clustr, you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use the App.
        </Text>
      </Section>

      <Section title="2. Eligibility">
        <Text style={styles.text}>
          You must be at least 18 years of age to use Clustr. By using the App, you represent
          and warrant that you are 18 years of age or older.
        </Text>
      </Section>

      <Section title="3. User Accounts">
        <Text style={styles.text}>
          You must provide accurate and complete information when creating an account. You are
          responsible for maintaining the confidentiality of your account credentials and for
          all activities that occur under your account.
        </Text>
      </Section>

      <Section title="4. User Conduct">
        <Text style={styles.text}>You agree not to:</Text>
        <Text style={styles.bullet}>- Post false, misleading, or fraudulent information</Text>
        <Text style={styles.bullet}>- Harass, threaten, or harm other users</Text>
        <Text style={styles.bullet}>
          - Upload content that is illegal, offensive, or violates another person&apos;s rights
        </Text>
        <Text style={styles.bullet}>- Impersonate another person or entity</Text>
        <Text style={styles.bullet}>- Use the App for any illegal purposes</Text>
      </Section>

      <Section title="5. Events and Meetups">
        <Text style={styles.text}>
          Event creators are responsible for accurate event information. Clustr is not
          responsible for the organization or execution of events. Users attend events at their
          own risk. Clustr is not liable for any incidents, injuries, or damages that occur
          during events.
        </Text>
      </Section>

      <Section title="6. Disclaimer of Warranties">
        <Text style={styles.text}>
          The App is provided as is without warranties of any kind, either express or implied.
        </Text>
      </Section>

      <Section title="7. Contact Information">
        <Text style={styles.text}>
          For questions about these Terms of Service, please contact us at support@clustr.app.
        </Text>
      </Section>
    </View>
  );
}

function PrivacyPolicy() {
  return (
    <View style={styles.document}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last Updated: January 2025</Text>

      <Section title="1. Introduction">
        <Text style={styles.text}>
          Clustr respects your privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our mobile application.
        </Text>
      </Section>

      <Section title="2. Information We Collect">
        <Text style={styles.subtitle}>Account Information</Text>
        <Text style={styles.text}>
          Email address, name, age, gender, location, bio, interests, campus access status,
          invite-code access status, and profile photo.
        </Text>
        <Text style={styles.subtitle}>Usage Data</Text>
        <Text style={styles.text}>
          Features used, events viewed, RSVPs, time spent in app, and device information.
        </Text>
      </Section>

      <Section title="3. How We Use Your Information">
        <Text style={styles.bullet}>- Provide and maintain App functionality</Text>
        <Text style={styles.bullet}>- Create and manage your user account</Text>
        <Text style={styles.bullet}>- Connect you with campus events and other users</Text>
        <Text style={styles.bullet}>- Send notifications about events and updates</Text>
        <Text style={styles.bullet}>- Improve and personalize your experience</Text>
        <Text style={styles.bullet}>- Help ensure security and prevent fraud</Text>
      </Section>

      <Section title="4. How We Share Your Information">
        <Text style={styles.subtitle}>With Other Users</Text>
        <Text style={styles.text}>
          Your profile information, such as name, photo, bio, and interests, may be visible
          to other users. Your attendance at public or campus events may be visible to event
          hosts and attendees.
        </Text>
        <Text style={styles.subtitle}>With Service Providers</Text>
        <Text style={styles.text}>
          Firebase provides authentication, database, and storage services for the App.
        </Text>
      </Section>

      <Section title="5. Your Privacy Rights">
        <Text style={styles.text}>You have the right to:</Text>
        <Text style={styles.bullet}>- Access a copy of your personal data</Text>
        <Text style={styles.bullet}>- Correct inaccurate information</Text>
        <Text style={styles.bullet}>- Request deletion of your account and data</Text>
        <Text style={styles.bullet}>- Request your data in a portable format</Text>
      </Section>

      <Section title="6. Data Security">
        <Text style={styles.text}>
          We implement reasonable security measures including secure authentication through
          Firebase and access controls. However, no method of transmission over the Internet
          is 100% secure.
        </Text>
      </Section>

      <Section title="7. Children Privacy">
        <Text style={styles.text}>
          Clustr is intended for users 18 years of age and older. We do not knowingly collect
          information from individuals under 18.
        </Text>
      </Section>

      <Section title="8. Contact Us">
        <Text style={styles.text}>
          Email: support@clustr.app{"\n"}
          Address: University of Illinois Chicago, Chicago, IL
        </Text>
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 12, color: colors.inputText },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.placeholder,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  document: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.inputText,
  },
  updated: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: colors.inputText,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: colors.inputText,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.inputText,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.inputText,
    marginLeft: 8,
  },
});
