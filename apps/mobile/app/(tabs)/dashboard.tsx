import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const now = new Date().toLocaleString("vi-VN");
  const modules = ["Body", "Workout", "Nutrition", "Sleep", "Mood", "Goals"];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.brand}>GunSelf</Text>
          <Text style={styles.title}>Mobile Dashboard</Text>
          <Text style={styles.subtitle}>Scan test page is running on your phone.</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Expo SDK 54 Ready</Text>
          </View>
          <Text style={styles.timeLabel}>Current time: {now}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today Modules</Text>
          <View style={styles.grid}>
            {modules.map((item) => (
              <View key={item} style={styles.moduleCard}>
                <Text style={styles.moduleText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220" },
  content: { padding: 16, gap: 14 },
  hero: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  brand: { color: "#34d399", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  title: { marginTop: 6, fontSize: 28, fontWeight: "800", color: "#f8fafc" },
  subtitle: { marginTop: 8, color: "#cbd5e1", fontSize: 14 },
  badge: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#052e2b",
    borderWidth: 1,
    borderColor: "#0f766e",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: { color: "#5eead4", fontWeight: "700", fontSize: 12 },
  timeLabel: { marginTop: 10, color: "#94a3b8", fontSize: 12 },
  section: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  sectionTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleCard: {
    width: "48%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center"
  },
  moduleText: { color: "#e2e8f0", fontWeight: "600" }
});
