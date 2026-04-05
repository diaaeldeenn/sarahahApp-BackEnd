import { get, incr, set, ttl_redis } from "../../../DB/redis/redis.service.js";
import { Hash } from "../security/hash.security.js";
import { eventEmitter } from "./email.event.js";
import { email_Template } from "./email.template.js";
import { generateOtp, sendEmail } from "./send.email.js";

export const sendEmailOtp = async (email) => {
  const isBlocked = await ttl_redis(`block_otp::${email}`);
  if (isBlocked > 0) {
    throw new Error(`Please Try Again After ${isBlocked} Second`);
  }
  const ttl = await ttl_redis(`otp::${email}`);
  if (ttl > 0) {
    throw new Error(`You Can Resend Otp After ${ttl} Second`);
  }
  const maxOtp = await get(`max_otp::${email}`);
  if (maxOtp >= 3) {
    await set({ key: `block_otp::${email}`, value: 1, ttl: 60 * 5 });
    throw new Error("You Have Exceeded The Max Number Of Tries");
  }
  const otp = await generateOtp();
  eventEmitter.emit("confirmEmail", async () => {
    await sendEmail({
      to: email,
      subject: "Welcome To SarahahApp",
      html: email_Template(otp),
    });
    await set({
      key: `otp::${email}`,
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 2,
    });
    await incr(`max_otp::${email}`);
  });
};
