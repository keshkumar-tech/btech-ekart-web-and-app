// A horizontal scroller that works INSIDE a vertical ScrollView.
//
// A `FlatList` nested in a ScrollView has no intrinsic height, so its rows get
// clipped (that is what cut the category chips and squeezed the product rows).
// A plain horizontal ScrollView sizes itself from its children, so it is
// always fully visible. For the small lists the app renders on Home (a handful
// of cards), the virtualisation a FlatList adds is not needed anyway.
import React from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { spacing } from "@/theme";

export default function HorizontalScroll<T>({
  data,
  renderItem,
  keyExtractor,
  gap = spacing(3),
  horizontalPadding = spacing(4),
  style,
  contentStyle,
}: {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  gap?: number;
  horizontalPadding?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // A horizontal ScrollView inside a vertical one otherwise measures as
      // infinite width and its children overflow the screen edge. Constrain it
      // to the CONTENT width (screen − this list's own padding) so the last
      // chip/card can scroll fully into view and nothing spills over.
      style={[styles.scroll, { width: width - horizontalPadding * 2 }, style]}
      contentContainerStyle={[
        // `alignItems: flex-start` stops each card from being stretched to the
        // tallest sibling, which is what truncated the details block.
        { paddingHorizontal: 0, gap, alignItems: "flex-start" },
        contentStyle,
      ]}
      nestedScrollEnabled
    >
      {/* Render the children directly — wrapping each one in a flex View made
          the card inside stretch past its own height and clipped the details. */}
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flexGrow: 0 keeps the scroller at its natural height inside a ScrollView.
  scroll: { flexGrow: 0 },
});
