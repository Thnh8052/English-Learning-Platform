import express from 'express';
import multer from 'multer';
import * as aiController from '../controllers/ai.controllers.js';
import * as aiService from '../services/ai.services.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Thư mục lưu tạm

router.post('/generate-from-text', aiController.generateFromText);
router.post('/generate-from-file', upload.single('file'), aiController.generateFromFile);
router.post('/grade-writing', aiService.gradeWritingTask);
router.post('/grade-speaking', upload.single('audio'), aiService.gradeSpeakingAnswer);

export default router;