import { avater } from "@/constants/images";
import { styles } from "@/constants/styles";
import React from "react";
import { Image, Text, View } from "react-native";

const UserCard = ({
  username,
  balance,
  colors,
}: {
  username?: string;
  balance: number;
  colors: any;
}) => {
  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Image source={avater} style={styles.avatarImage} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.userName, { color: "#ffffff" }]}>
            {username}
          </Text>
          <Text style={[styles.userType, { color: "#e6eeff" }]}>
            Customer Account
          </Text>
        </View>
        <View style={styles.balanceWrap}>
          <Text style={[styles.balanceLabel, { color: "#e6eeff" }]}>
            Balance
          </Text>
          <Text style={[styles.balanceValue, { color: "#ffffff" }]}>
            ₦{balance}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default UserCard;
