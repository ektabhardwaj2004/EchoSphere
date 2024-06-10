const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("crypto");
const { createTokenForUser } = require("../services/authentication");
const Otp = require("./otp");
const LoginUser = require("./userLogin")

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "/images/defaultProfile.jpg",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    followings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

//This function is executed just before creating a user
userSchema.pre("save", function (next) {
  const user = this; //contains the current user
  if (!user.isModified("password")) return; //checks if the user password has been modified or not
  const salt = randomBytes(16).toString(); //creating a salt for each user for security purpose
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex"); // basically this line created a hashed pass and then updates the user password which is given in hex format
  this.salt = salt;
  this.password = hashedPassword;
  next();
});

// Post-save hook to create OTP and Loginuser detai,s
userSchema.post("save", async function (doc, next) {
  console.log("post hook");
  try {
    await Otp.create({ email: doc.email });
    await LoginUser.create({email : doc.email , username : doc.username , profilePic : doc.profilePic , followers : doc.followers.length , followings : doc.followings.length  })
  } catch (err) {
    next(err);
  }
});


userSchema.static(
  "matchPasswordandGenerateToken",
  async function (email, password) {
    const user = await this.findOne({ email: email });
    if (!user) throw new Error("User not found!");
    const salt = user.salt;
    const hashedPassword = user.password;
    const userProvideHash = createHmac("sha256", salt)
      .update(password)
      .digest("hex");
    if (hashedPassword != userProvideHash) {
      throw new Error("Incorrect Password");
    }
    const token = createTokenForUser(user);
    return token;
  }
);

const User = mongoose.model("user", userSchema);
module.exports = User;
