import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        currentStudents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        }],
        status: {
            type: String,
            enum: ["ACTIVE", "PAUSED"],
            default: "ACTIVE",
        },
        avgInterviewDuration: {
            type: Number,
            default: 15, // in minutes
        },
        isGDEnabled: {
            type: Boolean,
            default: false,
        },
        currentGDGroup: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        }],
    },
    { timestamps: true }
);

// Re-register model if cached version has old schema (pre currentStudents array migration)
if (mongoose.models.Room && !mongoose.models.Room.schema.path('currentStudents')) {
    delete mongoose.models.Room;
}
const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);


export default Room;
