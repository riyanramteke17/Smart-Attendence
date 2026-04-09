import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firestoreError, setFirestoreError] = useState(null);

    // 1. Initial Auth Result Check (for redirects)
    useEffect(() => {
        const checkRedirect = async () => {
            try {
                await getRedirectResult(auth);
            } catch (error) {
                console.error("Redirect recovery error:", error);
                setFirestoreError(`Auth Redirect Error: ${error.message}`);
            }
        };
        checkRedirect();

        const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
            console.log("🔐 Auth State Changed:", u?.email || "No User");
            setUser(u);
            if (!u) {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // 2. Proactive Profile Initialization & Sync
    useEffect(() => {
        if (!user) return;

        let isMounted = true;
        setLoading(true);
        setFirestoreError(null);

        const initializeUser = async () => {
            try {
                console.log("📂 Proactively checking profile for:", user.email);
                const userRef = doc(db, 'users', user.uid);
                const snap = await getDoc(userRef);

                if (!snap.exists()) {
                    console.log("🆕 No profile found, creating fresh student profile...");
                    const isMainAdmin = user.email === 'riyanramteke17@gmail.com';
                    const newUser = {
                        id: user.uid,
                        uid: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        role: isMainAdmin ? 'admin' : 'student',
                        isAdmin: isMainAdmin,
                        isTeacher: false,
                        isStudent: !isMainAdmin,
                        createdAt: new Date().toISOString(),
                    };
                    await setDoc(userRef, newUser);
                    console.log("✅ Profile created via getDoc check!");
                    if (isMounted) {
                        setUserData(newUser);
                        setLoading(false);
                    }
                } else {
                    console.log("📄 Profile exists, starting real-time sync...");
                    // No need to set loading(false) here, onSnapshot will do it
                }
            } catch (err) {
                console.error("❌ Initial profile check failed:", err);
                if (isMounted) {
                    setFirestoreError(`Database Access Error: ${err.message}. Please check your internet and Firestore Rules.`);
                    setLoading(false);
                }
            }
        };

        initializeUser();

        // Start Real-time Listener
        const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            if (!isMounted) return;

            if (snapshot.exists()) {
                const data = snapshot.data();
                const currentRole = String(data.role || 'student').toLowerCase();

                // SuperAdmin Override
                let finalRole = currentRole;
                if (user.email === 'riyanramteke17@gmail.com' && currentRole !== 'admin') {
                    finalRole = 'admin';
                }

                const enriched = {
                    ...data,
                    id: user.uid,
                    uid: user.uid,
                    role: finalRole,
                    isAdmin: finalRole === 'admin',
                    isTeacher: finalRole === 'teacher',
                    isStudent: finalRole === 'student',
                };

                setUserData(enriched);
                setLoading(false);
                setFirestoreError(null);

                // Background Heal (Silent)
                const isOutOfSync = !data.id || !data.uid || data.role !== finalRole;
                if (isOutOfSync) {
                    setDoc(doc(db, 'users', user.uid), {
                        id: user.uid,
                        uid: user.uid,
                        role: finalRole,
                        isAdmin: finalRole === 'admin',
                        isTeacher: finalRole === 'teacher',
                        isStudent: finalRole === 'student'
                    }, { merge: true }).catch(e => console.warn("Background heal blocked by rules, ignoring."));
                }
            }
        }, (err) => {
            console.error("📡 Snapshot listener error:", err);
            if (isMounted) {
                setFirestoreError(`Sync Error: ${err.message}`);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribeProfile();
        };
    }, [user]);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error("Popup error:", error);
            setLoading(false);
            throw error;
        }
    };

    const register = async (email, password, name, role = 'student') => {
        setLoading(true);
        const res = await createUserWithEmailAndPassword(auth, email, password);
        return res;
    };

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, userData, login, loginWithGoogle, register, logout, loading, firestoreError }}>
            {children}
        </AuthContext.Provider>
    );
}

// Keep backward-compatible export for any files still importing useAuth from here
export const useAuth = () => useContext(AuthContext);
