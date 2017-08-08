import React from 'react';
import { Animated, View, Button, TouchableOpacity, Text } from 'react-native';

import { height, width } from '../global';

export const FluidCard = props =>
  <Animated.View style={[styles.cardStyle, { height: props.height }]}>
    <View style={[{ flex: 1 }, props.style]}>
      {props.children}
    </View>
  </Animated.View>;

const styles = {
  cardStyle: {
    width: width * 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
};
