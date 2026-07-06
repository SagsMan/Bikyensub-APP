import {
  AirtimeIcon,
  bankIcon,
  bvnIcon,
  CacIcon,
  DataIcon,
  ElectricityIcon,
  ExamsIcon,
  ninIcon,
  starIcon,
  TvIcon,
} from "./images";

export const services = [
  { id: "airtime", label: "Airtime", icon: AirtimeIcon },
  { id: "data", label: "Data", icon: DataIcon },
  { id: "electricity", label: "Electricity Bills", icon: ElectricityIcon },
  { id: "exams", label: "Exams Tokens", icon: ExamsIcon },
  { id: "tv", label: "TV Subscription", icon: TvIcon },
  { id: "cac", label: "CAC Registration", icon: CacIcon },
  { id: "transfer", label: "Money Transfer", icon: bankIcon },
  { id: "more", label: "Verifications", icon: starIcon },
];

export const verification = [
  {
    id: "nin",
    label: "NIN Verify",
    icon: ninIcon,
    subList: [
      // { name: "NIN Modification" },
      // { name: "NIN Personalization" },
      // { name: "NIN Redular Slip" },
      // { name: "Improved NIN Slip" },
      // { name: "Premium NIN Slip" },
      // { name: "Basic Verification Slip" },
    ],
  },
  {
    id: "bvn",
    label: "BVN Verify",
    icon: bvnIcon,
    subList: [],
    // subList: [{ name: "Basic BVN Slip" }, { name: "Advanced BVN Slip" }],
  },
];
