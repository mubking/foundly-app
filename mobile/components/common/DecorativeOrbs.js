import React from "react";
import { View, StyleSheet } from "react-native";

export default function DecorativeOrbs({ orbs }) {
  return (
    <>
      {orbs.map((orb, index) => (
        <View
          key={index}
          style={[
            styles.orb,
            {
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              top: orb.top,
              right: orb.right,
              bottom: orb.bottom,
              left: orb.left,
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
  },
});
