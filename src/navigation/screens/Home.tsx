import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';


export function Home() {
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Text>Benvenuto nella mia app 🙃</Text>
      <Button screen='Category'>Go to Categoty</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});
