import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "./index.js";

const generativeAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Base models
export const flashModel = generativeAI.getGenerativeModel({ model: config.gemini.flashModel });
// proModel defaults to flashModel when GEMINI_MODEL_PRO is not configured
export const proModel = generativeAI.getGenerativeModel({ 
  model: config.gemini.proModel || config.gemini.flashModel 
});

// Specific variants
export const flashLiteModel = generativeAI.getGenerativeModel({ model: config.gemini.flashLiteModel });
export const flash25Model = generativeAI.getGenerativeModel({ model: config.gemini.flash25Model });
export const flash20LiteModel = generativeAI.getGenerativeModel({ model: config.gemini.flash20LiteModel });
export const pro25Model = generativeAI.getGenerativeModel({ model: config.gemini.pro25Model });

// Image models
export const flash25ImageModel = generativeAI.getGenerativeModel({ model: config.gemini.flash25ImageModel });
export const proImageModel = generativeAI.getGenerativeModel({ model: config.gemini.proImageModel });
export const imageFlashModel = generativeAI.getGenerativeModel({ model: config.gemini.imageFlashModel });
export const imageProModel = generativeAI.getGenerativeModel({ model: config.gemini.imageProModel });

// Video & Audio
export const videoModel = generativeAI.getGenerativeModel({ model: config.gemini.videoModel });
export const ttsProModel = generativeAI.getGenerativeModel({ model: config.gemini.ttsProModel });
export const ttsFlashModel = generativeAI.getGenerativeModel({ model: config.gemini.ttsFlashModel });
export const audioNativeModel = generativeAI.getGenerativeModel({ model: config.gemini.audioNativeModel });

export const models = {
    flash: flashModel,
    pro: proModel,
    flashLite: flashLiteModel,
    flash25: flash25Model,
    flash20Lite: flash20LiteModel,
    pro25: pro25Model,
    imageFlash: imageFlashModel,
    imagePro: imageProModel,
    video: videoModel,
    ttsPro: ttsProModel,
    ttsFlash: ttsFlashModel,
    audioNative: audioNativeModel,
};

export default generativeAI;
