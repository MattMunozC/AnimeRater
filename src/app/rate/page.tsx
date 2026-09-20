import type { Metadata } from "next";
import ServerLayout from "../ServerLayout";
import RateExperience from "./rate-experience";

export const metadata: Metadata = {
  title: "Rate — AnimeRater",
  description: "Watch an anime opening or ending and give it your score.",
};

export default function RatePage() {
  return (
    <ServerLayout>
      <RateExperience />
    </ServerLayout>
  );
}
