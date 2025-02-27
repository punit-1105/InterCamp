import firebase from 'firebase/app';
import { config } from './config'
import 'firebase/firestore';
import 'firebase/auth';

// get user object and store in database
export const createUserProfileDocument = async (userAuth, additionalData) => {
    if (!userAuth) return;
    const userRef = firestore.doc(`users/${userAuth.uid}`);
    const snapShot = await userRef.get();

    if (!snapShot.exists) {
        const { displayName, email } = userAuth;
        // when the user was created
        const createdAt = new Date();
        try {
            await userRef.set({
                displayName,
                email,
                createdAt,
                ...additionalData
            })
        } catch (error) {
            console.log('error creating user', error.message);
        }
    }
    return userRef;
};

export const addQuizzesAndDocuments = async (quizKey, objectsToAdd) => {
    const quizRef = firestore.collection(quizKey);
    // batch groups all calls in one request
    const batch = firestore.batch();
    objectsToAdd.forEach(obj => {
        // create unique key
        const newDocRef = quizRef.doc();
        batch.set(newDocRef, obj);
    });
};

// Get Snapshot Array
export const convertCollectionsSnapshotToMap = (collections) => {
    const transformedCollection = collections.docs.map(doc => {
        const { title, questions } = doc.data();
        return {
            routeName: encodeURI(title.toLowerCase()),
            id: doc.id,
            title,
            questions
        }
    });

    return transformedCollection.reduce((accumulator, collection) => {
        accumulator[collection.title.toLowerCase()] = collection;
        return accumulator;
    }, {});
}

firebase.initializeApp(config);

export const auth = firebase.auth();
export const firestore = firebase.firestore();

const googleprovider = new firebase.auth.GoogleAuthProvider();
// trigger the pop-up from google provider
googleprovider.setCustomParameters({ prompt: "select_account" });

const fbprovider = new firebase.auth.FacebookAuthProvider();
fbprovider.setCustomParameters({ display: 'popup' });

var githubprovider = new firebase.auth.GithubAuthProvider();
githubprovider.setCustomParameters({ login: "select_account" })

const getProviderById = (id) => {
    const providers = {
        'google.com': googleprovider,
        'github.com': githubprovider,
        'facebook.com': fbprovider
    }
    return providers[id];
}

const handleDuplicateAccounts = (error) => {
    if (error.code === 'auth/account-exists-with-different-credential') {
        var pendingCred = error.credential;
        var email = error.email;
        auth.fetchSignInMethodsForEmail(email).then(function (methods) {
            const provider = getProviderById(methods[0]);
            auth.signInWithPopup(provider).then(function (result) {
                result.User.linkAndRetrieveDataWithCredential(pendingCred).then(function (usercred) {
                    // handle userCredential
                    //console.log(usercred);
                });
            });
        });
    }
}

export const signInWithGoogle = () => auth.signInWithRedirect(googleprovider).catch(handleDuplicateAccounts);

export const signInWithFacebook = () => auth.signInWithRedirect(fbprovider).catch(handleDuplicateAccounts);

export const signInWithGitHub = () => auth.signInWithRedirect(githubprovider).catch(handleDuplicateAccounts);



export default firebase;