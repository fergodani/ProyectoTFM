import { View } from "react-native";

const DashedLine = () => {
    return (
        <View
            style={{
                borderBottomWidth: 1,
                borderStyle: "dashed",
                borderColor: "#ccc",
                marginVertical: 16,
                width: "100%",
            }}
        />
    );
};

export default DashedLine;
