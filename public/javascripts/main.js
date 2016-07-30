/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes BlocApp.
function BlocApp() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.userName = document.getElementById('user-name');
  this.googleSignInButton = document.getElementById('google-sign-in');
  this.googleSignOutButton = document.getElementById('google-sign-out');

  // Saves message on form submit.
  this.googleSignOutButton.addEventListener('click', this.signOut.bind(this));
  this.googleSignInButton.addEventListener('click', this.signIn.bind(this));

  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiates firebase auth.
BlocApp.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listens to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Signs-in Bloc App.
BlocApp.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);

};

// Signs-out of Bloc App.
BlocApp.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
BlocApp.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Set user's profile name, show sign out btn & hide sign in btn.
    var userName = user.displayName;
    this.userName.textContent = userName;
    this.userName.removeAttribute('hidden');
    this.googleSignOutButton.removeAttribute('hidden');
    this.googleSignInButton.setAttribute('hidden', 'true');
    console.log(userName + ' signed in!');
  } else {
    // Hide user's profile and sign out button / show sign in button.
    this.userName.setAttribute('hidden', 'true');
    this.googleSignOutButton.setAttribute('hidden', 'true');
    this.googleSignInButton.removeAttribute('hidden');
    console.log('User signed out!');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
BlocApp.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
    console.log('User is signed in');
  } else {
    window.alert('User is not signed in.');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
BlocApp.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

window.onload = function() {
  window.BlocApp = new BlocApp();
};
