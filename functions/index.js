/**
 * functions/index.js
 * The Nervous System of The Zen Family Planner
 */

// 🔴 CHANGE: Explicitly import 'v1' to enable the classic syntax
const functions = require("firebase-functions/v1"); 
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Trigger: When a new document is created in 'tasks' collection
 * Action: Send a push notification to the assignee
 */
exports.onTaskCreated = functions.firestore
  .document("tasks/{taskId}")
  .onCreate(async (snapshot, context) => {
    
    // 1. Get the data from the new task
    const task = snapshot.data();
    const assigneeId = task.assigneeId;
    const taskTitle = task.title || "New Task";

    // Stop if there is no assignee or if it's unassigned
    if (!assigneeId) return null;

    try {
      // 2. Lookup the Assignee's User Profile to find their tokens
      const userDoc = await admin.firestore().collection("users").doc(assigneeId).get();
      
      if (!userDoc.exists) {
        console.log(`No user found for ID: ${assigneeId}`);
        return null;
      }

      const userData = userDoc.data();
      const tokens = userData.fcmTokens || [];

      if (tokens.length === 0) {
        console.log(`User ${assigneeId} has no FCM tokens.`);
        return null;
      }

      // 3. Construct the Payload
      // ⚠️ PRIVACY CHECK: Do NOT include medical details in the notification body.
      const message = {
        notification: {
          title: "New Task Assigned",
          body: `Please review: "${taskTitle}"`, 
        },
        data: {
          url: "/tasks", 
          taskId: context.params.taskId
        },
        tokens: tokens, // Send to ALL of this user's devices
      };

      // 4. Send the Message
      const response = await admin.messaging().sendEachForMulticast(message);
      
      if (response.failureCount > 0) {
        console.log("Some tokens failed:", response.responses);
      }

      console.log(`Successfully sent message to ${response.successCount} devices.`);
      return null;

    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  });

/**
 * Trigger: When a task is UPDATED (e.g., new note added)
 * Action: Check if a new note mentions someone and notify them.
 */
exports.onTaskUpdated = functions.firestore
  .document("tasks/{taskId}")
  .onUpdate(async (change, context) => {
    
    const newData = change.after.data();
    const oldData = change.before.data();

    // 1. Get the lists of updates (notes)
    const newUpdates = newData.updates || [];
    const oldUpdates = oldData.updates || [];

    // 2. Check if a NEW note was added
    if (newUpdates.length > oldUpdates.length) {
      
      // Get the very last note added
      const latestNote = newUpdates[newUpdates.length - 1];

      // 3. Check for mentions
      // We expect the frontend to save: { text: "...", mentions: ['uid1', 'uid2'] }
      if (latestNote.mentions && latestNote.mentions.length > 0) {
        
        const senderName = latestNote.user || "A family member";
        const taskTitle = newData.title || "Task";

        // Loop through everyone mentioned
        // (In a real app, you might want to batch this, but a loop is fine for family size)
        for (const recipientId of latestNote.mentions) {
           
           // Don't notify the person who wrote the note (if they tagged themselves)
           // (Assuming you have access to who wrote it, otherwise skip check)
           
           try {
             // Fetch their tokens
             const userDoc = await admin.firestore().collection("users").doc(recipientId).get();
             if (userDoc.exists) {
                const userData = userDoc.data();
                const tokens = userData.fcmTokens || [];

                if (tokens.length > 0) {
                  const payload = {
                    notification: {
                      title: `New Mention from ${senderName}`,
                      body: latestNote.text, // "Hey @Bob can you grab milk?"
                    },
                    data: {
                      url: "/tasks", // Or deep link to specific task
                      taskId: context.params.taskId
                    },
                    tokens: tokens
                  };

                  await admin.messaging().sendEachForMulticast(payload);
                  console.log(`Notified ${userData.email} about a mention.`);
                }
             }
           } catch (e) {
             console.error(`Failed to notify ${recipientId}`, e);
           }
        }
      }
    }
    return null;
  });