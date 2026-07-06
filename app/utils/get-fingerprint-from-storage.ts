import AsyncStorage from "@react-native-async-storage/async-storage";

export const getFingerFromStorage = async () => {
  try {
    const storedFinger = await AsyncStorage.getItem("finger");

    if (storedFinger !== null) {
      return storedFinger === "1"; 
    }
  } catch (error) {
    console.error("Error retrieving finger from storage:", error);
    return false;
  }
};
