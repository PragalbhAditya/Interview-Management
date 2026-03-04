import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        currentStudent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "PAUSED"],
            default: "ACTIVE",
        },
        avgInterviewDuration: {
            type: Number,
            default: 15, // in minutes
        },
    },
    { timestamps: true }
);

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);

export default Room;
