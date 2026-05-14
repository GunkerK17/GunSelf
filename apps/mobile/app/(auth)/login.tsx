import { Link } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Supabase auth placeholder screen</Text>
        <Link href="/(tabs)/dashboard" style={styles.link}>
          Continue to app
        </Link>
        <Link href="/(auth)/register" style={styles.linkMuted}>
          Create account
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    gap: 10
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569"
  },
  link: {
    marginTop: 8,
    color: "#047857",
    fontWeight: "600"
  },
  linkMuted: {
    color: "#334155"
  }
});
