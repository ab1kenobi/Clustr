import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function ChooseInterests() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<string[]>([]);

  const interests = [
    'Tech', 'Outdoors', 'Art', 'Food', 'Activism', 'Music',
    'Fitness', 'Gaming', 'Spirituality', 'Networking', 'Education', 'Volunteering',
  ];

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
        ? [...prev, interest]
        : prev
    );
  };

  const handleContinue = () => {
    if (selected.length < 3) {
      alert('Please select at least 3 interests');
      return;
    }

    const fullData = { ...params, interests: selected };
    console.log('Final meetup data:', fullData);
    router.push('/'); // Replace with next screen or backend submission
  };

  return (
    <ScrollView contentContainerStyle={styles.centeredContent}>
      <Text style={styles.title}>Choose 3–5 Interests</Text>

      <View style={styles.grid}>
        {interests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.tag,
              selected.includes(interest) ? styles.tagSelected : null,
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text
              style={[
                styles.tagText,
                selected.includes(interest) ? styles.tagTextSelected : null,
              ]}
            >
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          selected.length < 3 ? styles.disabledButton : null,
        ]}
        onPress={handleContinue}
        disabled={selected.length < 3}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  tagSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tagText: {
    color: '#333',
    fontSize: 14,
  },
  tagTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
