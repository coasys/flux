import CommunityGraph from "./components/CommunityGraph";

export default function App({ perspective, source }) {
  if (!perspective || !source) {
    return null;
  }

  return <CommunityGraph source={source} uuid={perspective} />;
}
