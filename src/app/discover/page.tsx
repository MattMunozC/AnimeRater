import type { Metadata } from "next";
import ServerLayout from "../ServerLayout";
import Discover from "./discover";

export const metadata: Metadata = {
  title: "Discover — AnimeRater",
  description: "Browse anime openings and endings and build your room queue.",
};

export default function DiscoverPage() {
  return (
    <ServerLayout>
      <Discover />
    </ServerLayout>
  );
}
