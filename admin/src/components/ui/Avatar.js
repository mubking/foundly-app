import { initials } from "@/lib/format";

export default function Avatar({ user, size = 32 }) {
  if (user?.avatar) {
    return (
      // Arbitrary remote Cloudinary URLs, not build-time-known assets —
      // next/image requires a configured remote pattern per host.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-primary"
      style={{ width: size, height: size }}
    >
      {initials(user)}
    </div>
  );
}
