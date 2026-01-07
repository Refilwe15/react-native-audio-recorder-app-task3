import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';

export default function LandingScreen() {
  return (
    <View style={styles.container}>
     {/* Title and subtitle section */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Record your audio</Text>
        <Text style={styles.subtitle}>
          Capture voice notes, meetings and ideas with ease
        </Text>
      </View>

    {/* landing image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/landing.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

    {/* Get Started Button */}

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
  },

  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 90,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    marginTop: 10,
  },

  imageContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '80%',
    height: '80%',
  },

  button: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 14,
    marginHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
