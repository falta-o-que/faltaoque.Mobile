import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutAnimation } from 'react-native';

import { Container, DropdownContent } from './styles';

export default function AnimatedDropdown({ open, children }) {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      if (!visible) {
        progress.setValue(0);
        LayoutAnimation.configureNext(LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut));
        setVisible(true);
        return undefined;
      }

      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }

    if (!visible) return undefined;

    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      LayoutAnimation.configureNext(LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut));
      setVisible(false);
    });
    return () => animation.stop();
  }, [open, progress, visible]);

  const contentStyle = {
    opacity: progress,
    transform: [
      { scaleY: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
    ],
  };

  return visible ? (
    <Container pointerEvents={open ? 'auto' : 'none'}>
      <DropdownContent style={contentStyle}>{children}</DropdownContent>
    </Container>
  ) : null;
}
