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
  this.resumeContainer = document.getElementById('resume-container');
  this.resumeForm = document.getElementById('resume-form');
  this.resumeFnameInput = document.getElementById('resume-fname');
  this.resumeLnameInput = document.getElementById('resume-lname');
  this.resumeHometownInput = document.getElementById('resume-hometown');
  this.resumeAdvisorInput = document.getElementById('resume-advisor');
  this.resumeYearInput = document.getElementById('resume-year');
  this.resumeTypeInput = document.getElementById('resume-type');
  this.resumeLinkedinurlInput = document.getElementById('resume-linkedinURL');
  this.submitButton = document.getElementById('submit');
  this.resume = document.getElementById('resume');
  this.userName = document.getElementById('user-name');
  this.googleSignInButton = document.getElementById('google-sign-in');
  this.googleSignOutButton = document.getElementById('google-sign-out');

  // Saves resume on form submit.
  this.resumeForm.addEventListener('submit', this.saveResume.bind(this));

  // Adds listener to sign in and out buttons.
  this.googleSignOutButton.addEventListener('click', this.signOut.bind(this));
  this.googleSignInButton.addEventListener('click', this.signIn.bind(this));

  this.initFirebase();
};

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

// Loads most recent resume and listens for upcoming ones.
BlocApp.prototype.loadResume = function(userId) {
	// Reference to the /resume-copies database path.
	var uid = firebase.auth().currentUser.uid;

	// solution 1 - borrowed from lines 118-120
	// var updates = {};
	// updates['/users/' + currentUser.uid + '/resume-copies'];
	// return firebase.database().ref().update(updates);

	// solution 2 - http://stackoverflow.com/questions/35446695/firebase-deep-query-orderbychild-with-equalto
	// this.usersRef = this.ref.child('users');
	// this.currentUserRef = this.usersRef.child(this.uid);
	// this.copiesRef = this.currentUserRef.child('resume-copies';
	// this.resumesRef = this.database.ref(this.copiesRef);

	// solution 3 - borrowed from line 60
	// this.resumesRef = this.database.ref('resumes/' + this.uid + '/resume-copies');
	// console.log('Hit ../uid/resume-copies');

  // Current Solution - reference to the /resumes/ database path.
  this.resumesRef = this.database.ref('resumes');
	console.log('Hit /resumes');
  // Make sure we remove all previous listeners.
  this.resumesRef.off();

  // Loads the last resume and listen for new ones.
  var setResume = function(data) {
    var val = data.val();
    this.displayResume(data.key, val.name, val.fname, val.lname, val.hometown, val.advisor, val.year, val.type, val.linkedinURL);
  }.bind(this);
  this.resumesRef.limitToLast(1).on('child_added', setResume);
	console.log('Completed loadResume');
};

// Saves a new resume on the Firebase DB under 'resumes' & 'user/:uid/resume-copies'
BlocApp.prototype.saveResume = function(e) {
  e.preventDefault();
  // Check that the user entered a resume and is signed in.
  var currentUser = this.auth.currentUser;

  var resumeData = {
    name: currentUser.displayName,
    email: currentUser.email,
    fname: this.resumeFnameInput.value,
    lname: this.resumeLnameInput.value,
    hometown: this.resumeHometownInput.value,
    advisor: this.resumeAdvisorInput.value,
    year: this.resumeYearInput.value,
    type: this.resumeTypeInput.value,
    linkedinURL: this.resumeLinkedinurlInput.value
  };

  // Get a key for a new resume.
  var newResumeKey = firebase.database().ref().child('resumes').push().key;

  // Write the new resume's data simultaneously in the resumes list and the user's resume list.
  var updates = {};
  updates['/resumes/' + newResumeKey] = resumeData;
  updates['/users/' + currentUser.uid + '/resume-copies' + newResumeKey] = resumeData;

  return firebase.database().ref().update(updates);
  console.log(this.resumeFnameInput.value +'\'s resume successfully written to db');
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
    // Set user's profile name / show resume-container & sign out btn / hide sign in btn.
    var userName = user.displayName ;
    this.userName.textContent = 'Hi ' + userName + '!';
    this.userName.removeAttribute('hidden');
    this.resumeContainer.removeAttribute('hidden');
    this.googleSignOutButton.removeAttribute('hidden');
    this.googleSignInButton.setAttribute('hidden', 'true');

    // We load currently existing resume.
    this.loadResume();

    // store info
    this.writeUserData(user.uid, user.displayName, user.email);
    console.log(userName + ' signed in.');
  } else {
    // Hide user's profile, resume, and sign out button / show sign in button.
    this.userName.setAttribute('hidden', 'true');
    this.resumeContainer.setAttribute('hidden', 'true');
    this.googleSignOutButton.setAttribute('hidden', 'true');
    this.googleSignInButton.removeAttribute('hidden');
  };
};

// Returns true if user is signed-in. Otherwise false and displays a resume.
BlocApp.prototype.checkSignedInWithResume = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
    console.log('User is signed in');
  } else {
    window.alert('User is not signed in.');
  }
};

// Returns resume submission.
BlocApp.prototype.displayResume = function(key, name, fname, lname, hometown, advisor, year, type, linkedinURL) {
  var uid = firebase.auth().currentUser.uid;

  var resumeTemplate =
      '<div class="resume-filler" style="float: right;">' +
        '<h3>Resume</h3>' +
        '<div class="res fname"></div>' +
        '<div class="res lname"></div>' +
        '<div class="res hometown"></div>' +
        '<div class="res advisor"></div>' +
        '<div class="res year"></div>' +
        '<div class="res type"></div>' +
        '<div class="res linkedinURL"></div>' +
      '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = resumeTemplate;
  var resumeElement = div.firstChild;
  this.resume.appendChild(div);

  resumeElement.getElementsByClassName('fname')[0].innerText = "First Name: " + fname;
  resumeElement.getElementsByClassName('lname')[0].innerText = "Last Name: " + lname;
  resumeElement.getElementsByClassName('hometown')[0].innerText = "Hometown: " + hometown;
  resumeElement.getElementsByClassName('advisor')[0].innerText = "Advisor: " + advisor;
  resumeElement.getElementsByClassName('year')[0].innerText = "Year: " + year;
  resumeElement.getElementsByClassName('type')[0].innerText = "Type: " + type;
  resumeElement.getElementsByClassName('linkedinURL')[0].innerText = "LinkedIn URL: " + linkedinURL;

  return resumeElement;
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
