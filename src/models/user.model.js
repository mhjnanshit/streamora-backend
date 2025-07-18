import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  avatar: {
    // profile pic
    type: String, // cloudinary url
    required: true,
  },
  coverImage: {
    type: String, // cloudinary url
  },
  watchHistory: [
    {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  refreshToken: {
    type: String
  },  
},{
    timestamps: true
});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next() // tabhi chalao agar password change hua ho
    this.password = bcrypt.hash(this.password, 10) // hash rounds
    next()
})


// This function returns T/F
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password) // pehla hai entered pwd and second is encrypted pws by bcrypt 
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id: this._id, // key
            email: this.email,
            username: this.username, // payload     // We are storing in all this in our Access Token
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
      {
        _id: this._id, // key
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
}


export const User = mongoose.model("User", userSchema)