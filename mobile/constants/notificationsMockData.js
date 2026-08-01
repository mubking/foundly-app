export const NOTIFICATION_TYPES = {
  match: { icon: "zap", color: "amber" },
  found: { icon: "search", color: "primary" },
  reward: { icon: "dollar", color: "green" },
  approved: { icon: "check", color: "green" },
  rejected: { icon: "x", color: "red" },
};

export const NOTIFICATIONS = [
  {
    id: 1,
    type: "match",
    title: "Possible Match Found!",
    body: "Your lost wallet may match an item found 0.3mi away in Times Square.",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "found",
    title: "New Item Near You",
    body: "Someone found an iPhone 15 Pro near Central Park — 89% match with your report.",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    type: "reward",
    title: "Reward Received 🎉",
    body: "You earned $50 for returning Sarah Mitchell's wallet. Funds on the way.",
    time: "2h ago",
    read: true,
  },
  {
    id: 4,
    type: "approved",
    title: "Claim Approved",
    body: "Your claim for the AirPods Pro has been approved! Arrange pickup with James.",
    time: "Yesterday",
    read: true,
  },
  {
    id: 5,
    type: "rejected",
    title: "Claim Not Verified",
    body: "Your claim for Ray-Ban Glasses didn't pass verification. Submit more evidence.",
    time: "2d ago",
    read: true,
  },
];
