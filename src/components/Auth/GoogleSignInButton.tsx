import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

const { width } = Dimensions.get('window');

interface GoogleSignInButtonProps {
  onSignInSuccess?: (user: any) => void;
  onSignInError?: (error: string) => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
  onSignInError,
  style,
  textStyle,
  disabled = false,
}) => {
  const { isSignedIn, user, isLoading, error, signIn, signOut } = useGoogleSignIn();

  React.useEffect(() => {
    if (error && onSignInError) {
      onSignInError(error);
    }
  }, [error, onSignInError]);

  React.useEffect(() => {
    if (isSignedIn && user && onSignInSuccess) {
      onSignInSuccess(user);
    }
  }, [isSignedIn, user, onSignInSuccess]);

  const handlePress = async () => {
    if (isSignedIn) {
      await signOut();
    } else {
      await signIn();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" style={styles.icon} />
        ) : (
          <FontAwesome
            name="google"
            size={20}
            color="#fff"
            style={styles.icon}
          />
        )}
        <Text style={[styles.buttonText, textStyle]}>
          {isLoading
            ? 'Caricamento...'
            : isSignedIn
            ? 'Disconnetti da Google'
            : 'Accedi con Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#db4437',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.9,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default GoogleSignInButton;
