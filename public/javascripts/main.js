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
  this.addResume = document.getElementById('add-resume');
  this.resumeForm = document.getElementById('resume-form');

  // this.viewResume = document.getElementById('view-resume');

  // Saves resume on form submit.
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

// Writes the user's data to the database
BlocApp.prototype.writeUserData = function(userId, name, email) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email
  });
};

// Writes the user's resume data to the database
BlocApp.prototype.writeNewResume = function(uid, username, fname, lname, hometown, advisorName, year, type, linkedinURL) {
  // A resume entry.
  var resumeData = {
    author: username,
    uid: uid,
    fname: fname,
    lname: lname,
    hometown: hometown,
    advisorName: advisorName,
    year: year,
    type: type,
    linkedinURL: linkedinURL
  };

  // Get a key for a new Resume.
  var newResumeKey = firebase.database().ref().child('resumes').push().key;

  // Write the new resume's data simultaneously in the resumes list and the user's resume list.
  var updates = {};
  updates['/resumes/' + newResumeKey] = resumeData;
  updates['/user-resumes/' + uid + '/' + newResumeKey] = resumeData;

  return firebase.database().ref().update(updates);
};

// Creates a resume elements
BlocApp.prototype.createResumeElement = function(resumeId, author, authorID, username, fname, lname, hometown, advisorName, year, type, linkedinURL) {
  var uid = firebase.auth().currentUser.uid;

  var html =
      '<div class="resume">' +
        '<div class="resume-username"></div>' +
        '<div class="resume-fname"></div>' +
        '<div class="resume-lname"></div>' +
        '<div class="resume-hometown"></div>' +
        '<div class="resume-advisor"></div>' +
        '<div class="resume-year"></div>' +
        '<div class="resume-type"></div>' +
        '<div class="resume-linkedinURL"></div>' +
      '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;

  // Set values.
  resumeElement.getElementsByClassName('resume-username')[0].innerText = author || 'Anonymous';
  resumeElement.getElementsByClassName('resume-fname')[0].innerText = fname;
  resumeElement.getElementsByClassName('resume-lname')[0].innerText = lname;
  resumeElement.getElementsByClassName('resume-hometown')[0].innerText = hometown;
  resumeElement.getElementsByClassName('resume-advisor')[0].innerText = advisor;
  resumeElement.getElementsByClassName('resume-year')[0].innerText = year;
  resumeElement.getElementsByClassName('resume-type')[0].innerText = type;
  resumeElement.getElementsByClassName('resume-linkedinURL')[0].innerText = linkedinURL;

  return resumeElement;
};

// Starts listening for new resumes.
BlocApp.prototype.startDatabaseQuery = function() {
  var myUserId = firebase.auth().currentUser.uid;

  var userResumesRef = firebase.database().ref('user-resumes/' + myUserId);

  var fetchResumes = function(resumesRef, sectionElement) {
    resumesRef.on('child_added', function(data) {
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('resume-container')[0];
      containerElement.insertBefore(
          createresumeElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic),
          containerElement.firstChild);
    });
  };

  fetchResumes(userResumesRef, userResumesSection);
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
    var userName = user.displayName ;
    this.userName.textContent = 'Hi ' + userName + '!';
    this.userName.removeAttribute('hidden');
    this.googleSignOutButton.removeAttribute('hidden');
    this.googleSignInButton.setAttribute('hidden', 'true');
    this.addResume.removeAttribute('hidden');

    // store info
    this.writeUserData(user.uid, user.displayName, user.email);
    console.log(userName + ' signed in & their information has been stored.');

    // find resume
    this.startDatabaseQuery();
    console.log(username + '\'s resume found!');

  } else {
    // Hide user's profile/resume form and sign out button / show sign in button.
    this.userName.setAttribute('hidden', 'true');
    this.googleSignOutButton.setAttribute('hidden', 'true');
    this.googleSignInButton.removeAttribute('hidden');
    this.addResume.setAttribute('hidden', 'true');
    console.log('User signed out!');
  }
};

// Saves resume on form submit.
// BlocApp.prototype.resumeForm.onsubmit = function(e) {
//    e.preventDefault();
//    var userId = firebase.auth().currentUser.uid;
//    firebase.database().ref('/users/' + userId).then(function(snapshot) {
//      var username = snapshot.val().username;
//      writeNewResume(firebase.auth().currentUser.uid, firebase.auth().currentUser.displayName).then(function() {
//        myResumesMenuButton.click();
//      });
//    });
//  };

// Returns true if user is signed-in. Otherwise false and displays a resume.
BlocApp.prototype.checkSignedInWithresume = function() {
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
