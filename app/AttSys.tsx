// import { Dropdown } from '@electricui/components-desktop-blueprint';
import React from "react";
import { Button, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
       // justifyContent: "center",
       // alignItems: "center",
        padding: 10,
      }}
    >

      <Dropdown></Dropdown>
      <Text>Select Event</Text>
      <Button title={"scan fingerprint"}></Button>
      <Text>Status: Ready</Text>
      <Button title={"view attendance"}></Button>

    </View>
  );
}
