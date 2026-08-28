import { useOutboundProfile } from "@/hooks/use-outbound-profile";
import MitarbeiterBewerbungsgespraeche from "./Bewerbungsgespraeche";
import InterneBewerbungsgespraeche from "./InterneBewerbungsgespraeche";

/** Wählt zwischen den externen Outbound-Gesprächen und unseren internen Gesprächen. */
export default function BewerbungsgespraecheRoute() {
  const { data, isPending } = useOutboundProfile();
  if (isPending) return null;
  if (data?.internalInterviews && !data?.outboundRecruitment) {
    return <InterneBewerbungsgespraeche />;
  }
  return <MitarbeiterBewerbungsgespraeche />;
}
