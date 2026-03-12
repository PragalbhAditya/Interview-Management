import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        registrationNumber: {
            type: String,
            required: true,
            unique: true,
        },
        branch: {
            type: String,
            default: "",
        },
        contactNumber: {
            type: String,
            default: "",
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        status: {
            type: String,
            enum: ["WAITING", "INTERVIEWING", "COMPLETED"],
            default: "WAITING",
        },
        queuePosition: {
            type: Number,
            default: null,
        },
        checkInTime: {
            type: Date,
            default: Date.now,
        },
        interviewStartTime: {
            type: Date,
            default: null,
        },
        interviewEndTime: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
