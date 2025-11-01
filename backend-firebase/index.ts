import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { VertexAI } from "@google-cloud/vertexai";

// Define types locally to avoid import issues from frontend
type CharacterStatus = "pending" | "training" | "ready" | "error";

interface UserCharacter {
  id: string;
  userId: string;
  characterName: string;
  status: CharacterStatus;
  createdAt: admin.firestore.Timestamp;
  description: string;
  keywords: string[];
  imagePreviewUrl: string;
  adapterId: string | null;
}

// Helper function to determine MIME type from a file path
function getMimeType(filePath: string): string {
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".jpeg") || lowerPath.endsWith(".jpg")) return "image/jpeg";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  // Default fallback, although frontend should prevent other types.
  return "image/jpeg";
}

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// --- Configuration for Vertex AI ---
const PROJECT_ID = "character-studio-comics";
const LOCATION = "us-central1";

const regionalFunctions = functions.region("us-central1");

// --- Function 1: Get Character Library ---
export const getCharacterLibrary = regionalFunctions.https.onCall(
  async (data, context): Promise<UserCharacter[]> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "You must be logged in."
        );
      }
      const uid = context.auth.uid;

      const snapshot = await db
        .collection("user_characters")
        .where("userId", "==", uid)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserCharacter));
    } catch (error) {
        console.error("Error in getCharacterLibrary:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Failed to load character library.");
    }
  }
);

// --- Function 2: Start "Training" (Simulation) ---
export const startCharacterTuning = regionalFunctions.https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
      }

      const { files } = data; // settings are unused in simulation
      const uid = context.auth.uid;

      const newCharRef = db.collection("user_characters").doc();
      const characterId = newCharRef.id;

      await newCharRef.set({
        userId: uid,
        status: "pending" as CharacterStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        adapterId: null,
        characterName: "Processing...",
        description: "",
        keywords: [],
        imagePreviewUrl: files[0] || null, 
      });
      
      simulateTraining(characterId);

      return { characterId };
    } catch (error) {
        console.error("Error in startCharacterTuning:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Failed to start character training.");
    }
  }
);

async function simulateTraining(characterId: string) {
  const charRef = db.collection("user_characters").doc(characterId);
  try {
    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    
    await charRef.update({ status: "training" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Analyze a character. Generate a JSON object with:
      1. 'characterName': A cool, creative name.
      2. 'description': A brief, descriptive paragraph.
      3. 'keywords': An array of 5 relevant string keywords.
      Respond only with the valid JSON object.
    `;
    
    const parts = [{ text: prompt }];
    
    const result = await generativeModel.generateContent({ contents: [{ role: 'user', parts }] });
    const response = result.response;
    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason && ['SAFETY', 'RECITATION'].includes(candidate.finishReason)) {
        console.warn(`Character analysis stopped due to ${candidate.finishReason}. Using fallback data.`);
    }
    
    const responseText = candidate?.content?.parts?.[0]?.text;
    
    let aiData = {
        characterName: "Mysterious Hero",
        description: "A character of unknown origin, ready for adventure.",
        keywords: ["mysterious", "heroic", "adventurous", "brave", "enigmatic"]
    };
    
    if (responseText) {
      try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiData = JSON.parse(jsonMatch[0]);
          }
      } catch (e) {
          console.warn("Failed to parse AI response, using fallback.", e);
      }
    }

    await charRef.update({
      status: "ready",
      characterName: aiData.characterName,
      description: aiData.description,
      keywords: aiData.keywords,
      adapterId: `simulated-adapter-${Date.now()}`
    });

  } catch (error) {
    console.error("Simulation Training failed:", error);
    await charRef.update({ status: "error" });
  }
}

// --- Function 3: Generate Image ---
export const generateCharacterVisualization = regionalFunctions.runWith({timeoutSeconds: 120, memory: '1GB'}).https.onCall(
  async (data, context): Promise<{ base64Image: string }> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
      }
      
      const { characterId, prompt } = data;
      
      const charDoc = await db.collection("user_characters").doc(characterId).get();
      if (!charDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Character not found.");
      }
      const character = charDoc.data() as UserCharacter;

      if (!character.imagePreviewUrl) {
          throw new functions.https.HttpsError("failed-precondition", "Character has no preview image for reference.");
      }

      // Download reference image from GCS
      const bucket = getStorage().bucket(admin.app().options.storageBucket);
      const file = bucket.file(character.imagePreviewUrl);
      const [imageBuffer] = await file.download();
      const imageBase64FromStorage = imageBuffer.toString("base64");
      
      const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
      const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

      const generationPrompt = `Using the provided image as a reference for the character's appearance, place this character in the following scene: "${prompt}".`;
      
      const imagePart = {
          inlineData: {
              mimeType: getMimeType(character.imagePreviewUrl),
              data: imageBase64FromStorage,
          },
      };
      const textPart = { text: generationPrompt };

      const result = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [textPart, imagePart] }],
          // FIX: Explicitly tell the model to generate an image as output.
          // This was the missing piece causing the model to return an empty response.
          config: {
            responseModalities: ['IMAGE']
          }
      });
      
      const candidate = result.response.candidates?.[0];

      if (!candidate) {
          throw new functions.https.HttpsError("internal", "The AI model returned an empty response. Please try again.");
      }

      if (candidate.finishReason && ['SAFETY', 'RECITATION'].includes(candidate.finishReason)) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              `Your prompt was blocked for safety reasons (${candidate.finishReason}). Please modify your prompt and try again.`
          );
      }

      const imagePartFromAI = candidate.content?.parts?.find(part => part.inlineData);
      const imageBase64 = imagePartFromAI?.inlineData?.data;

      if (!imageBase64) {
        throw new functions.https.HttpsError("internal", "The AI failed to generate an image. Please try rephrasing your prompt.");
      }
      
      return { base64Image: imageBase64 };
    } catch (error: any) {
        console.error("Critical error in generateCharacterVisualization:", {
            message: error.message,
            stack: error.stack,
            details: error.details
        });
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected server error occurred during image generation.");
    }
  }
);