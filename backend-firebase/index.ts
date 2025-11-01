import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { VertexAI } from "@google-cloud/vertexai";
import * as cors from "cors";

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

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
  return "image/jpeg";
}

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// --- Configuration for Vertex AI ---
const PROJECT_ID = "character-studio-comics";
const LOCATION = "us-central1";

const regionalFunctions = functions.region("us-central1");

// --- PREVIEW MODE: MOCK USER ID ---
const MOCK_USER_ID = 'mock-user-for-preview';

// --- Function 1: Get Character Library (Refactored to onRequest) ---
export const getCharacterLibrary = regionalFunctions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const uid = MOCK_USER_ID; 

            const snapshot = await db
                .collection("user_characters")
                .where("userId", "==", uid)
                .get();

            const characters = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as UserCharacter));
            
            // httpsCallable expects a `data` wrapper in the response
            response.status(200).send({ data: characters });

        } catch (error) {
            console.error("Error in getCharacterLibrary:", error);
            response.status(500).send({ error: { message: "Failed to load character library." } });
        }
    });
  }
);

// --- Function 2: Start "Training" (Refactored to onRequest) ---
export const startCharacterTuning = regionalFunctions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const uid = MOCK_USER_ID; 
            
            // For httpsCallable, the payload is in request.body.data
            const { files } = request.body.data;
            
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
            
            response.status(200).send({ data: { characterId } });

        } catch (error) {
            console.error("Error in startCharacterTuning:", error);
            response.status(500).send({ error: { message: "Failed to start character training." } });
        }
    });
  }
);

async function simulateTraining(characterId: string) {
  // This is an async background process, so no changes are needed here.
  // It's not directly called by the client.
  const charRef = db.collection("user_characters").doc(characterId);
  try {
    await charRef.update({ status: "training" });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Analyze a character. Generate a JSON object with: 'characterName', 'description', 'keywords' (array of 5). Respond only with valid JSON.`;
    const result = await generativeModel.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let aiData = { characterName: "Mysterious Hero", description: "A character of unknown origin.", keywords: ["mysterious"] };
    if (responseText) {
      try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) aiData = JSON.parse(jsonMatch[0]);
      } catch (e) { console.warn("Failed to parse AI response, using fallback.", e); }
    }
    
    await charRef.update({ status: "ready", ...aiData, adapterId: `simulated-adapter-${Date.now()}` });
  } catch (error) {
    console.error("Simulation Training failed:", error);
    await charRef.update({ status: "error" });
  }
}

// --- Function 3: Generate Image (Refactored to onRequest) ---
export const generateCharacterVisualization = regionalFunctions.runWith({timeoutSeconds: 120, memory: '1GB'}).https.onRequest(
  (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const { characterId, prompt } = request.body.data;
            
            const charDoc = await db.collection("user_characters").doc(characterId).get();
            if (!charDoc.exists) {
                response.status(404).send({ error: { message: "Character not found." } });
                return;
            }
            const character = charDoc.data() as UserCharacter;

            if (!character.imagePreviewUrl) {
                response.status(400).send({ error: { message: "Character has no preview image for reference." } });
                return;
            }

            const bucket = getStorage().bucket();
            const file = bucket.file(character.imagePreviewUrl);
            const [imageBuffer] = await file.download();
            const imageBase64FromStorage = imageBuffer.toString("base64");
            
            const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
            const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

            const result = await generativeModel.generateContent({
                contents: { 
                    parts: [
                        { inlineData: { mimeType: getMimeType(character.imagePreviewUrl), data: imageBase64FromStorage } },
                        { text: `Using the provided image as a reference for the character's appearance, place this character in the following scene: "${prompt}".` }
                    ]
                }
            });
            
            // DEFINITIVE FIX: The SDK returns an array with a single response object.
            const generationResponse = result[0];
            const imageBase64 = generationResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

            if (!imageBase64) {
                console.error("AI response did not contain image data. Full response:", JSON.stringify(generationResponse, null, 2));
                response.status(500).send({ error: { message: "The AI failed to generate an image. This might be due to a safety filter. Please try rephrasing your prompt." } });
                return;
            }
            
            response.status(200).send({ data: { base64Image: imageBase64 } });

        } catch (error: any) {
            console.error("Critical error in generateCharacterVisualization:", error);
            response.status(500).send({ error: { message: "An unexpected server error occurred during image generation." } });
        }
    });
  }
);