import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const progressDoc = await getDoc(doc(db, 'userProgress', userId));
    
    return {
      success: true,
      user: userDoc.data(),
      progress: progressDoc.data()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserProgress = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'userProgress', userId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addQuizResult = async (userId, quizData) => {
  try {
    await updateDoc(doc(db, 'userProgress', userId), {
      quizHistory: arrayUnion(quizData),
      quizzesCompleted: quizData.quizzesCompleted,
      totalPoints: quizData.totalPoints,
      lastActiveDate: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};