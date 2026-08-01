export const BALANCE_SUMMARY = {
  totalEarned: 340,
  subtitle: "Lifetime across 9 successful returns",
  breakdown: [
    { label: "Earned", value: "$370" },
    { label: "Posted", value: "$30" },
    { label: "Net", value: "$340" },
  ],
};

export const TRANSACTIONS = [
  { type: "earned", title: "Returned Sarah's wallet", from: "Sarah M.", amount: 50, date: "Jul 28" },
  { type: "earned", title: "Returned James's phone", from: "James K.", amount: 100, date: "Jul 20" },
  { type: "posted", title: "Reward posted", for: "Lost Keys", amount: -30, date: "Jul 15" },
  { type: "earned", title: "Returned Ana's keys", from: "Ana G.", amount: 30, date: "Jul 10" },
  { type: "posted", title: "Reward posted", for: "Lost Bag", amount: -20, date: "Jul 2" },
  { type: "earned", title: "Returned Tom's briefcase", from: "Tom B.", amount: 80, date: "Jun 28" },
];
