import mongoose from "mongoose";
import {
  RoleEnum,
  GenderEnum,
  ProviderEnum,
} from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.google ? false : true;
      },
      minLength: 8,
    },
    age: {
      type: Number,
      required: function () {
        return this.provider == ProviderEnum.google ? false : true;
      },
      minLength: 18,
      maxLength: 60,
    },
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    phone: String,
    profilePicture: {
      type: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    },
    confirmed: Boolean,
    totalViews: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },
    logOutTime: Date,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (v) {
    const [firstName, lastName] = v.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
  });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
