import Reactotron, { networking } from "reactotron-react-native";

Reactotron.configure() // controls connection & communication settings
  .useReactNative()
  .use(networking())
  .connect(); // let's connect!