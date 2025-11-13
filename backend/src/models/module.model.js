import mongoose from "mongoose";
const Schema = mongoose.Schema;

const moduleSchema = new Schema({
    title: { 
        type: String, 
        required: true 
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    // Thêm trường 'order' để sắp xếp các chương theo đúng thứ tự
    order: { 
        type: Number, 
        required: true 
    }
}, { timestamps: true });

const Module = mongoose.model("Module", moduleSchema);
export default Module;