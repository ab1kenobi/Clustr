import { auth, db } from "@/config/firebase";
import { isAllowedCampusEmail, isAllowedInviteCode } from "@/constants/campus";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type CampusUser = {
  email?: string;
  campusAccess?: string[];
  campusVerified?: boolean;
  schoolEmailVerified?: boolean;
  accessMethod?: string;
  inviteCodeUsed?: string;
};

export async function ensureUicCampusAccess() {
  const user = auth.currentUser;
  if (!user) {
    return {
      ok: false,
      title: "Sign in required",
      message: "Please sign in before creating a campus meetup.",
    };
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return {
      ok: false,
      title: "Profile missing",
      message: "Finish your profile before creating a campus meetup.",
    };
  }

  const data = snap.data() as CampusUser;
  const hasAccess =
    data.campusAccess?.includes("UIC") ||
    data.campusVerified ||
    data.schoolEmailVerified;

  if (hasAccess) return { ok: true };

  const email = user.email || data.email || "";
  const hasCampusEmail = isAllowedCampusEmail(email);
  const hasPilotInvite =
    data.accessMethod === "invite-code" || isAllowedInviteCode(data.inviteCodeUsed || "");

  if (!hasCampusEmail && !hasPilotInvite) {
    return {
      ok: false,
      title: "UIC access required",
      message:
        "Campus meetups can only be published by UIC-verified users. Sign up with a UIC email or use a pilot invite code on a new account.",
    };
  }

  await updateDoc(userRef, {
    campus: "UIC",
    campusAccess: ["UIC"],
    campusVerified: true,
    schoolEmailVerified: hasCampusEmail,
    accessMethod: hasCampusEmail ? "uic-email" : "invite-code",
  });

  return { ok: true };
}
