import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
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
  }
);

// --- Function 2: Start "Training" (Simulation) ---
export const startCharacterTuning = regionalFunctions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }

    const { files } = data; // settings are unused in simulation
    const uid = context.auth.uid;

    // Step 1: Create a record in the database with "pending" status
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
    
    // Step 2: Trigger the background "training" process without waiting for it to complete.
    // This allows the UI to immediately move to the progress page.
    simulateTraining(characterId);

    // Step 3: Return the character ID to the client.
    return { characterId };
  }
);

// Helper function to simulate the training process
async function simulateTraining(characterId: string) {
  const charRef = db.collection("user_characters").doc(characterId);
  try {
    // FIX: Lazy initialize VertexAI client inside the function
    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    
    // Step 3a: Change status to "training"
    await charRef.update({ status: "training" });
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

    // Step 3c: Call AI to generate description and name
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
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
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

    // Step 3d: Update the document to "ready" status
    await charRef.update({
      status: "ready",
      characterName: aiData.characterName,
      description: aiData.description,
      keywords: aiData.keywords,
      adapterId: `simulated-adapter-${Date.now()}` // Add a fake adapter ID
    });

  } catch (error) {
    console.error("Simulation Training failed:", error);
    await charRef.update({
      status: "error",
    });
  }
}

// --- Function 3: Generate Image ---
export const generateCharacterVisualization = regionalFunctions.runWith({timeoutSeconds: 120}).https.onCall(
  async (data, context): Promise<{ base64Image: string }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    
    const { characterId, prompt } = data;
    
    const charDoc = await db.collection("user_characters").doc(characterId).get();
    if (!charDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Character not found.");
    }
    const character = charDoc.data() as UserCharacter;
    
    // FIX: Lazy initialize VertexAI client inside the function
    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    
    // As per the prompt, we simulate image-to-image by using the character description
    // in the prompt, since we are not downloading the image from Storage for simplicity.
    const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    const generationPrompt = `
      A character described as: ${character.characterName}, ${character.description}.
      Place this character in the following scene: "${prompt}".
      Maintain the character's appearance based on the description.
    `;
    
    const parts = [{ text: generationPrompt }];

    const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts }],
        // The Node SDK does not use responseModalities. It infers from the model.
        // We expect the model 'gemini-2.5-flash-image' to return an image part.
    });

    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    const imageBase64 = imagePart?.inlineData?.data;

    if (!imageBase64) {
      console.error("AI response did not contain an image:", JSON.stringify(result.response, null, 2));
      throw new functions.https.HttpsError("internal", "The AI model failed to generate an image.");
    }
    
    return { base64Image: imageBase64 };
  }
);