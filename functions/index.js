const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

// --- 1. THE DEBUGGER ---
// Call this from the frontend to verify the pipe works.
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  const userId = context.auth.uid;
  
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const tokens = userDoc.data().fcmTokens || [];

  if (tokens.length === 0) return { success: false, message: "No tokens found." };

  const message = {
    notification: {
      title: "🔔 System Test",
      body: "If you can read this, notifications are working!",
    },
    tokens: tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  await cleanupTokens(response, tokens, userId);
  
  return { 
    success: true, 
    sentCount: response.successCount, 
    failureCount: response.failureCount 
  };
});

// --- 2. TASK ASSIGNMENT ---
exports.onTaskCreated = functions.firestore
  .document("tasks/{taskId}")
  .onCreate(async (snapshot, context) => {
    const task = snapshot.data();
    const assigneeId = task.assigneeId;

    if (!assigneeId) return null;

    // Fetch Recipient
    const userDoc = await admin.firestore().collection("users").doc(assigneeId).get();
    if (!userDoc.exists) return null;

    const tokens = userDoc.data().fcmTokens || [];
    if (tokens.length === 0) return null;

    // Send Payload
    const message = {
      notification: {
        title: "New Task Assigned",
        body: `${task.title}`,
      },
      data: { url: "/tasks" }, // For click handling
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    await cleanupTokens(response, tokens, assigneeId);
    return null;
  });

// --- 3. MENTIONS ---
exports.onTaskUpdated = functions.firestore
  .document("tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if updates array grew
    const newUpdates = newData.updates || [];
    const oldUpdates = oldData.updates || [];

    if (newUpdates.length > oldUpdates.length) {
      const latestNote = newUpdates[newUpdates.length - 1];

      if (latestNote.mentions && latestNote.mentions.length > 0) {
        const sender = latestNote.user.split('@')[0];

        for (const recipientId of latestNote.mentions) {
          const userDoc = await admin.firestore().collection("users").doc(recipientId).get();
          if (!userDoc.exists) continue;

          const tokens = userDoc.data().fcmTokens || [];
          if (tokens.length === 0) continue;

          const message = {
            notification: {
              title: `New Mention from ${sender}`,
              body: latestNote.text,
            },
            data: { url: "/tasks" },
            tokens: tokens,
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          await cleanupTokens(response, tokens, recipientId);
        }
      }
    }
    return null;
  });

// --- HELPER: Clean Dead Tokens ---
async function cleanupTokens(response, originalTokens, userId) {
  if (response.failureCount > 0) {
    const tokensToRemove = [];
    response.responses.forEach((result, index) => {
      if (result.error) {
        const err = result.error.code;
        if (err === 'messaging/invalid-registration-token' || 
            err === 'messaging/registration-token-not-registered') {
          tokensToRemove.push(originalTokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      console.log(`Removing ${tokensToRemove.length} dead tokens for user ${userId}`);
      await admin.firestore().collection("users").doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
      });
    }
  }
}