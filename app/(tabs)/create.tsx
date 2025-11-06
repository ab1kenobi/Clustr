import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';

export default function CreateMeetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    tags: '',
    visibility: 'public',
    image: null as string | null,
  });

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      handleChange('image', result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    router.push({
      pathname: '/choose',
      params: { ...formData },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/discover')} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Meetup</Text>
        </View>

        {/* Image Upload */}
        <TouchableOpacity style={styles.imageButton} onPress={handleImageUpload}>
          <Icon name="image" size={20} color="#333" />
          <Text style={styles.radioLabel}>Upload Meetup Image</Text>
        </TouchableOpacity>

        {formData.image && (
          <>
            <Image source={{ uri: formData.image }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => handleChange('image', null)}
            >
              <Icon name="x-circle" size={18} color="#d00" style={{ marginRight: 6 }} />
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Form */}
        <TextInput
          style={styles.input}
          placeholder="Meetup Title"
          value={formData.title}
          onChangeText={(text) => handleChange('title', text)}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={formData.description}
          onChangeText={(text) => handleChange('description', text)}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={formData.date}
          onChangeText={(text) => handleChange('date', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Time (HH:MM)"
          value={formData.time}
          onChangeText={(text) => handleChange('time', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Location"
          value={formData.location}
          onChangeText={(text) => handleChange('location', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Tags (comma-separated)"
          value={formData.tags}
          onChangeText={(text) => handleChange('tags', text)}
        />

        {/* Visibility */}
        <View style={styles.radioGroup}>
          {['public', 'private'].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.radioOption}
              onPress={() => handleChange('visibility', option)}
            >
              <Icon
                name={formData.visibility === option ? 'check-circle' : 'circle'}
                size={20}
                color={formData.visibility === option ? '#4CAF50' : '#999'}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.radioLabel}>
                {option === 'public' ? 'Public' : 'Private'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !formData.title || !formData.date || !formData.time || !formData.location || loading
            ? styles.disabledButton
            : null,
        ]}
        onPress={handleSubmit}
        disabled={!formData.title || !formData.date || !formData.time || !formData.location || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Next</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    lineHeight: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: { marginVertical: 12 },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: { fontSize: 16, color: '#333' },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeImageText: {
    color: '#d00',
    fontSize: 14,
  },
  submitButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
