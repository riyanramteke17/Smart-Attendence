import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firestoreError, setFirestoreError] = useState(null);
    
    // Track if we are currently creating a profile to avoid race conditions
    const isCreatingProfile = useRef(false);

    useEffect(() => {
        console.log("🛠️ AuthProvider Mounted");
        
        const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
            console.log("🔐 Auth State Changed:", u?.email || "No User");
            setUser(u);
            
            if (!u) {
                setUserData(null);
                setLoading(false);
                return;
            }

            // User is logged in, now sync/create profile
            try {
                const userRef = doc(db, 'users', u.uid);
                
                // Initial check to see if we need to create the profile
                const snap = await getDoc(userRef);
                
                if (!snap.exists() && !isCreatingProfile.current) {
                    isCreatingProfile.current = true;
                    console.log("🆕 New user detected! Creating profile for:", u.email);
                    
                    const isMainAdmin = u.email === 'riyanramteke17@gmail.com';
                    const newUser = {
                        id: u.uid,
                        uid: u.uid,
                        name: u.displayName || u.email.split('@')[0],
                        email: u.email,
                        role: isMainAdmin ? 'admin' : 'student',
                        isAdmin: isMainAdmin,
                        isTeacher: false,
                        isStudent: !isMainAdmin,
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
                    };
                    
                    await setDoc(userRef, newUser);
                    console.log("✅ New profile created successfully");
                    setUserData(newUser);
                    // Don't set loading(false) yet, let the snapshot listener take over to be consistent
                } else if (snap.exists()) {
                    console.log("📄 Profile found for:", u.email);
                    const currentData = snap.data();
                    
                    // SuperAdmin Override (Check email just in case)
                    if (u.email === 'riyanramteke17@gmail.com' && currentData.role !== 'admin') {
                        console.log("🛡️ SuperAdmin Override triggered");
                        await setDoc(userRef, { role: 'admin', isAdmin: true }, { merge: true });
                    }
                }
            } catch (err) {
                console.error("❌ Profile initialization error:", err);
                setFirestoreError(`Database Sync Error: ${err.message}`);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // Separated Listener Effect for real-time updates
    useEffect(() => {
        if (!user) return;

        console.log("📡 Starting Real-time sync for:", user.email);
        const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                console.log("📥 Received profile update:", data.role);
                
                setUserData({
                    ...data,
                    uid: user.uid, // Ensure UID consistency
                    id: user.uid
                });
                setLoading(false);
                setFirestoreError(null);
            } else if (!isCreatingProfile.current) {
                // Document doesn't exist and we aren't creating it? 
                // This shouldn't happen with the initializeUser logic above, 
                // but if it does, move to student dashboard with null data or similar
                console.warn("⚠️ Profile document missing from Firestore");
                // We keep loading=true if we assume initializeUser will create it soon
            }
        }, (err) => {
            console.error("📡 Snapshot listener error:", err);
            setFirestoreError(`Real-time Sync Error: ${err.message}`);
            setLoading(false);
        });

        return () => unsubscribeProfile();
    }, [user]);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error("Google Login Error:", error);
            setLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUserData(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            userData, 
            loginWithGoogle, 
            logout, 
            loading, 
            firestoreError 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
