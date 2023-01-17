import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Button, Text, View } from "react-native";
import DLOT from "./DLOT";

export default function App() {
  return (
    <View style={styles.container}>
      <DLOT />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
