let users = {};

function generatePassword() {
  const words = ["red", "blue", "green", "pink", "dog", "cat", "fox"];
  const password = words[Math.floor(Math.random() * words.length)];
  const username = document.getElementById("email").value;
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;

  if (!username || !firstName || !lastName || !email) {
    Swal.fire({
      icon: "error",
      title: "Please fill out all fields.",
    });
    return;
  }

  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      firstName,
      lastName,
      email,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const passwordDisplay = document.getElementById("password");
      if (data.message === "User registered successfully") {
        Swal.fire({
          title: "Success!",
          html: "<br><br>Please check your email for a code to complete verification.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else if (data.message === "Email already exists") {
        Swal.fire({
          title: "Error!",
          text: "Email already exists. Please choose another email.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    });
}

function showUsers() {
  fetch("/users")
    .then((response) => response.json())
    .then((data) => {
      users = {};
      data.forEach((user) => {
        users[user.email.toLowerCase()] = user;
      });
    })
    .catch((err) => console.error("Error fetching users:", err));
}

function filterUsersByEmail() {
  const search = document.getElementById("emailSearch").value.toLowerCase();
  const suggestionBox = document.getElementById("emailSuggestions");
  suggestionBox.innerHTML = "";

  let matches = [];

  if (!search) {
    matches = Object.values(users).sort((a, b) =>
      a.email.localeCompare(b.email)
    );
  } else {
matches = Object.entries(users)
  .filter(([email]) => email.includes(search))
  .map(([, user]) => user);

  }

  matches.forEach((user) => {
    const item = document.createElement("li");
    item.textContent = user.email;
    item.onclick = () => {
      displayUserDetails(user.email);
      suggestionBox.innerHTML = "";
      suggestionBox.style.display = "none";
      document.getElementById("emailSearch").value = user.email;

      const profilePicSection = document.getElementById("profilePicSection");
      const currentPic = document.getElementById("currentProfilePic");

      profilePicSection.style.display = "block";
      currentPic.src = `/uploads/${user.email}.jpg?${Date.now()}`;
      currentPic.style.display = "block";
      // check global
      window.selectedUserEmail = user.email;
    };
    suggestionBox.appendChild(item);
  });

  suggestionBox.style.display = matches.length ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailSearch");
  emailInput.addEventListener("focus", filterUsersByEmail);
  emailInput.addEventListener("input", filterUsersByEmail);
});


window.displaySignedInUserDetailsByEmail = function () {
  const selectedEmail = document.getElementById("signedInSelect").value;
  if (selectedEmail) {
    displayUserDetails(selectedEmail);
    document.getElementById("signedInDropdown").style.display = "none";
  }
};

function displayUserDetails(email) {
  const user = users[email.toLowerCase()];
  if (!user) return;

  window.selectedUserEmail = email.toLowerCase();

  const formattedSignInDate = new Date(user.signInDate).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const userDetails = `
    <div id="userTextInfo">
      <h3>User Details</h3>
      <strong>Username:</strong> ${user.username}<br>
      <strong>Password:</strong> ${user.password}<br>
      <strong>First Name:</strong> ${user.firstName}<br>
      <strong>Last Name:</strong> ${user.lastName}<br>
      <strong>Email:</strong> ${user.email}<br>
      <strong>Registered:</strong> ${user.registered}<br>
      <strong>Membership Type:</strong> ${user.membership}<br>
      <strong>Sign In Date:</strong> ${formattedSignInDate}<br>
      <strong>isSignedIn:</strong> ${user.isSignedIn}<br>
      <div id="userButtons">
      <button onclick="editUser('${user.username}')">Edit</button>
      <button onclick="deleteUser('${user.username}')">Delete</button>
      </div>
      <div id="profilePicSection" style="margin-top: 50px;">
        <h3>Upload Profile Picture</h3>
          <div class="centerInputWrapper">
    <input type="file" id="profilePicInput" accept="image/*" />
  </div>
        <div id="profilePicButtons">
          <button id="uploadPicBtn">Upload</button>
          <button id="deletePicBtn">Delete</button>
        </div>
      </div>
    </div>

    <div id="profilePicOnly">
      <img id="currentProfilePic" src="" alt="Profile Picture" style="display:none;" />
    </div>
  `;

  document.getElementById("userDetails").innerHTML = userDetails;

  const currentPic = document.getElementById("currentProfilePic");

  fetch(`/api/check-profile-pic/${email}`)
    .then(res => res.json())
    .then(({ exists }) => {
      currentPic.src = exists
        ? `/uploads/${email}.jpg?${Date.now()}`
        : "/uploads/blankpfp.png";
      currentPic.style.display = "block";
    })
    .catch(() => {
      currentPic.src = "/default-profile-pic.jpg";
      currentPic.style.display = "block";
    });

  document.getElementById("uploadPicBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("profilePicInput");
    const file = fileInput.files[0];

    if (!file) {
      Swal.fire("No File", "Please select a file to upload.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("email", email);

    try {
      const res = await fetch("/api/upload-profile-pic", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        await Swal.fire("Success", "Profile picture uploaded!", "success");
        document.getElementById("currentProfilePic").src = `/uploads/${email}.jpg?${Date.now()}`;
        location.reload();
      } else {
        Swal.fire("Upload Failed", result.message || "Upload failed.", "error");
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire("Error", "Something went wrong during upload.", "error");
    }
  });

  document.getElementById("deletePicBtn").addEventListener("click", async () => {
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the profile picture.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmation.isConfirmed) return;

    try {
      const res = await fetch("/api/delete-profile-pic", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (result.success) {
        Swal.fire("Deleted", "Profile picture deleted.", "success");
        currentPic.src = "";
        currentPic.style.display = "none";
      } else {
        Swal.fire("Delete Failed", result.message || "Could not delete picture.", "error");
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      Swal.fire("Error", "Something went wrong while deleting the picture.", "error");
    }
  });

  // Stats + dropdown
  const today = new Date();
  const signedInTodayUsers = Object.values(users).filter((u) => {
    const signInDate = new Date(u.signInDate);
    return (
      signInDate.getFullYear() === today.getFullYear() &&
      signInDate.getMonth() === today.getMonth() &&
      signInDate.getDate() === today.getDate()
    );
  });

  const totalSignedInToday = signedInTodayUsers.length;
  const signedInWithMembership = signedInTodayUsers.filter(
    (u) => u.membership > 0
  ).length;
  const signedInWithoutMembership = totalSignedInToday - signedInWithMembership;

  const statsHtml = `
    <h3>User Statistics</h3>
    <strong>Users Signed In Today:</strong> ${totalSignedInToday} <br>
    <strong>With Membership:</strong> ${signedInWithMembership} <br>
    <strong>Drop In:</strong> ${signedInWithoutMembership} <br>
  `;

  let signedInDropdown = `
    <label for="signedInSelect"><h3>Users Signed In Today</h3></label>
    <select id="signedInSelect" onchange="displaySignedInUserDetailsByEmail()">
      <option value="">Select a User</option>`;

  signedInTodayUsers.forEach((u) => {
    signedInDropdown += `<option value="${u.email.toLowerCase()}">${u.email}</option>`;
  });

  signedInDropdown += `</select>`;

  document.getElementById("userStats").innerHTML = statsHtml;
  document.getElementById("signedInDropdown").innerHTML = signedInDropdown;
  document.getElementById("signedInDropdown").style.display = "block";
}


function displaySignedInUserDetailsByEmail() {
  const selectedEmail = document.getElementById("signedInSelect").value;
  if (!selectedEmail) return;

  const user = users[selectedEmail];
  if (!user) return;

  const formattedSignInDate = new Date(user.signInDate).toLocaleString("en-US");

  const userDetails = `
    <h3>Signed In User Details</h3>
    <strong>Username:</strong> ${user.username}<br>
    <strong>Password:</strong> ${user.password}<br>
    <strong>First Name:</strong> ${user.firstName}<br>
    <strong>Last Name:</strong> ${user.lastName}<br>
    <strong>Email:</strong> ${user.email}<br>
    <strong>Registered:</strong> ${user.registered}<br>
    <strong>Membership Type:</strong> ${user.membership}<br>
    <strong>Sign In Date:</strong> ${formattedSignInDate}<br>
    <strong>isSignedIn:</strong> ${user.isSignedIn}<br>
    <button onclick="editUser('${user.username}')">Edit</button>
    <button onclick="deleteUser('${user.username}')">Delete</button>
  `;

  document.getElementById("signedInUserDetails").innerHTML = userDetails;
}

function editUser(username) {
  Swal.fire({
    title: `Edit User: ${username}`,
    width: "800px",
    customClass: {
      popup: "edit-user-modal",
    },
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <label for="swal-password" style="width: 200px;">New Password:</label>
          <input type="password" id="swal-password" class="swal2-input" style="flex: 1;">
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <label for="swal-email" style="width: 200px;">New Email:</label>
          <input type="email" id="swal-email" class="swal2-input" style="flex: 1;">
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <label for="swal-membership" style="width: 200px;">New Membership:</label>
          <input type="text" id="swal-membership" class="swal2-input" style="flex: 1;">
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <label for="swal-registered" style="width: 200px;">Registered:</label>
          <select id="swal-registered" class="swal2-select" style="flex: 1;">
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <label for="swal-signedIn" style="width: 200px;">Signed In:</label>
          <select id="swal-signedIn" class="swal2-select" style="flex: 1;">
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
      </div>
    `,
    confirmButtonText: "Save",
    showCancelButton: true,
    focusConfirm: false,
    preConfirm: () => {
      return {
        password: document.getElementById("swal-password").value,
        email: document.getElementById("swal-email").value,
        membership: document.getElementById("swal-membership").value,
        registered: parseInt(document.getElementById("swal-registered").value),
        isSignedIn: parseInt(document.getElementById("swal-signedIn").value),
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const values = result.value;
      let updatedData = {};

      if (values.password) updatedData.password = values.password;
      if (values.email) {
        updatedData.email = values.email;
        updatedData.username = values.email;
      }
      if (values.membership) updatedData.membership = values.membership;

      updatedData.registered = values.registered;
      updatedData.isSignedIn = values.isSignedIn;

      if (Object.keys(updatedData).length === 0) {
        Swal.fire("No changes made", "", "info");
        return;
      }

      fetch(`/users/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            Swal.fire("Error", data.error, "error");
          } else {
            Swal.fire("Success", `User ${username} updated successfully!`, "success").then(() => {
              showUsers();
              location.reload();
            });
          }
        })
        .catch((err) => {
          console.error("Error updating user:", err);
          Swal.fire("Error", "An unexpected error occurred.", "error");
        });
    }
  });
}


function deleteUser(username) {
  Swal.fire({
    title: `Delete ${username}?`,
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/users/${username}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then(() => {
          Swal.fire({
            title: "Deleted!",
            text: `${username} has been deleted.`,
            icon: "success",
          }).then(() => {
            showUsers();
            location.reload();
          });
        })
        .catch((err) => {
          console.error("Error deleting user:", err);
          Swal.fire("Error", "Could not delete the user.", "error");
        });
    }
  });
}


async function validateUser(username, password) {
  try {
    const response = await fetch("/users/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Validation failed");
    }

    return true;
  } catch (error) {
    Swal.fire({ icon: "error", title: error.message });
    return false;
  }
}

async function bookCourt() {
  await loadCourtData();
  const court = document.getElementById("courtSelection").value;
  let enteredUsernames = [];
  let enteredFullNames = [];

  let users = {};
  try {
    const response = await fetch("/users");
    const data = await response.json();
    users = data.reduce((acc, user) => {
      acc[user.username.toLowerCase()] = `${user.firstName} ${user.lastName}`;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching user data:", error);
    Swal.fire({
      icon: "error",
      title: "Error fetching user data. Please try again.",
    });
    return;
  }

  // Gather all booked usernames (not display names!)
  const allBookedUsernames = Object.values(courts).flatMap(
    (court) => court.currentUsernames || []
  );

  // Gather all queued usernames
  const allQueuedUsernames = Object.values(courts)
    .flatMap((court) => court.queueUsernames || [])
    .flat();

  for (let i = 1; i <= 4; i++) {
    const username = document
      .getElementById(`bookingUsername${i}`)
      .value
      .trim()
      .toLowerCase();

    const password = document.getElementById(`bookingPassword${i}`).value;

    if (username && password) {
      if (!users[username]) {
        Swal.fire({
          icon: "error",
          title: `User "${username}" not found.`,
        });
        return;
      }

      const isValid = await validateUser(username, password);
      if (!isValid) return;

      if (allBookedUsernames.includes(username)) {
        Swal.fire({
          icon: "error",
          title: `User ${users[username]} is already booked on another court.`,
        });
        return;
      }

      if (allQueuedUsernames.includes(username)) {
        Swal.fire({
          icon: "error",
          title: `User ${users[username]} is already in a court queue.`,
        });
        return;
      }

      enteredUsernames.push(username);
      enteredFullNames.push(users[username]);
    }
  }

  if (enteredUsernames.length !== 2 && enteredUsernames.length !== 4) {
    Swal.fire({
      icon: "error",
      title: "You can only book a court with 2 or 4 players.",
    });
    return;
  }

  const currentUsernames = courts[court].currentUsernames || [];
  const currentPlayers = courts[court].currentPlayers || [];

  if (currentUsernames.length === 0) {
    courts[court].currentUsernames = enteredUsernames;
    courts[court].currentPlayers = enteredFullNames;
    courts[court].timeLeft = 1800;
    startCountdown(court);
  } else if (
    currentUsernames.length === 2 &&
    enteredUsernames.length === 2
  ) {
    const totalUsernames = [...currentUsernames, ...enteredUsernames];
    const totalFullNames = [...currentPlayers, ...enteredFullNames];

    const uniqueUsernames = new Set(totalUsernames);
    if (uniqueUsernames.size < totalUsernames.length) {
      Swal.fire({
        icon: "error",
        title: "A player is already on this court.",
      });
      return;
    }

    courts[court].currentUsernames = totalUsernames;
    courts[court].currentPlayers = totalFullNames;
  } else {
    courts[court].queueUsernames = courts[court].queueUsernames || [];
    courts[court].queue = courts[court].queue || [];

    if (courts[court].queue.length < 3) {
      courts[court].queue.push(enteredFullNames);
      courts[court].queueUsernames.push(enteredUsernames);
    } else {
      Swal.fire({
        icon: "error",
        title: "Queue is full. Maximum 3 groups allowed.",
      });
      return;
    }
  }

  saveCourtData();
  clearBookingFields();
  renderCourts();
}

async function unbookCourt() {
  let enteredUsernames = [];

  let users = {};
  try {
    const response = await fetch("/users");
    const data = await response.json();
    users = data.reduce((acc, user) => {
      acc[user.username.toLowerCase()] = `${user.firstName} ${user.lastName}`;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching user data:", error);
    Swal.fire({
      icon: "error",
      title: "Error fetching user data. Please try again.",
    });
    return;
  }

  const allBookedUsernames = Object.values(courts).flatMap(court => [
    ...(court.currentUsernames || []),
    ...(court.queueUsernames ? court.queueUsernames.flat() : []),
  ]);

  for (let i = 1; i <= 4; i++) {
    const username = document.getElementById(`unbookingUsername${i}`).value.trim().toLowerCase();
    const password = document.getElementById(`unbookingPassword${i}`).value;

    if (username && password) {
      if (!users[username]) {
        Swal.fire({
          icon: "error",
          title: `User "${username}" not found.`,
        });
        return;
      }

      const isValid = await validateUser(username, password);
      if (!isValid) return;

      if (!allBookedUsernames.includes(username)) {
        Swal.fire({
          icon: "error",
          title: `User ${users[username]} is not part of any court booking or queue.`,
        });
        return;
      }

      enteredUsernames.push(username);
    }
  }

  if (enteredUsernames.length !== 2 && enteredUsernames.length !== 4) {
    Swal.fire({
      icon: "error",
      title: "You must unbook exactly 2 or 4 players.",
    });
    return;
  }

  let unbookedUsernames = [];

  for (const courtName in courts) {
    const court = courts[courtName];
    const { currentUsernames = [], currentPlayers = [], queue = [], queueUsernames = [] } = court;

    const playersToUnbook = enteredUsernames.filter((username) => currentUsernames.includes(username));

    if (playersToUnbook.length > 0) {
      court.currentUsernames = currentUsernames.filter(username => !playersToUnbook.includes(username));
      court.currentPlayers = currentPlayers.filter((_, i) => !playersToUnbook.includes(currentUsernames[i]));
      unbookedUsernames.push(...playersToUnbook);

      if (court.currentUsernames.length === 0 && court.queue.length > 0) {
        const nextQueuePlayers = court.queue.shift();
        const nextQueueUsernames = court.queueUsernames.shift();
        court.currentPlayers = nextQueuePlayers;
        court.currentUsernames = nextQueueUsernames;
        court.timeLeft = 1800;
        startCountdown(courtName);
      }
    }

    for (let i = queueUsernames.length - 1; i >= 0; i--) {
      const usernames = queueUsernames[i];
      const hasAnyToRemove = usernames.some(username => enteredUsernames.includes(username));
      if (hasAnyToRemove) {
        queueUsernames.splice(i, 1);
        queue.splice(i, 1);
        unbookedUsernames.push(...usernames.filter(username => enteredUsernames.includes(username)));
      }
    }
  }

  if (unbookedUsernames.length === 0) {
    Swal.fire({
      icon: "error",
      title: "No matching players found in bookings or queue.",
    });
    return;
  }

  saveCourtData(); 
  clearBookingFields();
  renderCourts();

  Swal.fire({
    icon: "success",
    title: "Players Unbooked Successfully",
    text: `Players ${unbookedUsernames.map(username => users[username]).join(", ")} have been removed from their court(s) or queue.`,
  });
}


function saveCourtData() {
  fetch("/update-courts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courts),
  });
}

let currentVersion = null;

function loadCourtData() {
  fetch("/courts")
    .then((response) => response.json())
    .then((data) => {
      if (currentVersion === null) {
        currentVersion = data.version;
        courts = data.courts;
        renderAndStart();
      } else if (data.version !== currentVersion) {
        location.reload();
      }
    })
    .catch((err) => console.error("Error fetching courts:", err));
}

function renderAndStart() {
  renderCourts();
  Object.keys(courts).forEach((court) => {
    if (
      courts[court].currentPlayers.length > 0 &&
      courts[court].timeLeft >= 0
    ) {
      startCountdown(court);
    }
  });
}

window.onload = function () {
  loadCourtData();
};

function startCountdown(court) {
  let interval = setInterval(() => {
    if (courts[court].timeLeft > 0) {
      courts[court].timeLeft--;
      renderCourts();
    } else {
      clearInterval(interval);

      courts[court].currentPlayers = [];
      courts[court].currentUsernames = []; 

      if (courts[court].queue.length > 0) {
        courts[court].currentPlayers = courts[court].queue.shift();
        courts[court].timeLeft = 1800;
        startCountdown(court);
      }

      renderCourts();
    }
  }, 1000);
}

function clearBookingFields() {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`bookingUsername${i}`).value = "";
    document.getElementById(`bookingPassword${i}`).value = "";
    document.getElementById(`unbookingUsername${i}`).value = "";
    document.getElementById(`unbookingPassword${i}`).value = "";
  }
}

function renderCourts() {
  let firstRow = "";
  let middleRow = "";
  let lastRow = "";

  const isAdminPage = window.location.pathname.includes("admin.html");
  const courtEntries = Object.entries(courts);

  courtEntries.forEach(([court, details], index) => {
    let isUnavailable =
      (typeof courtsData !== "undefined" && courtsData[court] === "unavailable") ||
      court === "Rest Area";
    let minutes = Math.floor(details.timeLeft / 60);
    let seconds = details.timeLeft % 60;

    let courtStatusClass = isUnavailable
      ? "unavailable"
      : details.currentPlayers.length === 0
      ? "open"
      : "closed";

    const adminClass = isAdminPage ? "court-card-admin" : "";

    let courtDisplay = `<div class="court-card ${courtStatusClass} ${adminClass}">`;
    courtDisplay += `<h3>${court}</h3>`;

    const statusText = isUnavailable
      ? "Unavailable"
      : details.currentPlayers.length === 0
      ? "Open"
      : "In Progress";

    courtDisplay += `<p class="status">${statusText}</p>`;

    if (!isUnavailable && courtStatusClass === "closed") {
      courtDisplay += `<p>Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}</p>`;
    }

    if (!isUnavailable) {
      courtDisplay += `<p>Current Players: ${
        details.currentPlayers.length ? details.currentPlayers.join(", ") : "None"
      }</p>`;
    }

    if (isAdminPage && !isUnavailable) {
      details.currentPlayers.forEach((player, i) => {
        courtDisplay += `<p>Player ${i + 1}: ${player} <button class="remove-btn" onclick="removePlayer('${court}', ${i})">Remove</button></p>`;
      });

      for (let q = 0; q < 3; q++) {
        const queueGroup = details.queue[q] || [];
        courtDisplay += `<p>Queue ${q + 1}: `;
        if (queueGroup.length > 0) {
          queueGroup.forEach((player, i) => {
            courtDisplay += `${player} <button class="remove-btn" onclick="removeQueuedPlayer('${court}', ${q}, ${i})">Remove</button>`;
            if (i < queueGroup.length - 1) courtDisplay += ", ";
          });
        } else {
          courtDisplay += "Empty";
        }
        courtDisplay += `</p>`;
      }
    } else if (!isUnavailable) {
      for (let i = 0; i < 3; i++) {
        courtDisplay += `<p>Queue ${i + 1}: ${
          details.queue[i] && details.queue[i].length ? details.queue[i].join(", ") : "Empty"
        }</p>`;
      }
    }

    courtDisplay += `</div>`;

    if (index < 3) {
      firstRow += courtDisplay;
    } else if (index < 7) {
      middleRow += courtDisplay;
    } else {
      lastRow += courtDisplay;
    }
  });

  document.getElementById("courtStatus").innerHTML = `
      <div class="row first-row">${firstRow}</div>
      <div class="row middle-row">${middleRow}</div>
      <div class="row last-row">${lastRow}</div>
  `;
}

function removePlayer(courtName, playerIndex) {
  const court = courts[courtName];
  if (!court || !court.currentPlayers) return;


  court.currentPlayers.splice(playerIndex, 1);

  saveCourtData().then(() => {
    loadCourtData();         // Reload from server to sync version
    clearBookingFields();    // Optional: clears input fields if used
    renderCourts();          // Re-render courts to reflect changes
  });
}



function removeQueuedPlayer(courtName, queueIndex, playerIndex) {
  const court = courts[courtName];
  if (!court || !court.queue || !court.queueUsernames) return;

  court.queue[queueIndex].splice(playerIndex, 1);
  court.queueUsernames[queueIndex].splice(playerIndex, 1);

  if (court.queue[queueIndex].length === 0) {
    court.queue.splice(queueIndex, 1);
    court.queueUsernames.splice(queueIndex, 1);
  }

saveCourtData().then(() => {
  loadCourtData();
  clearBookingFields();
  renderCourts();
});

}


// async function removePlayer(courtName, playerIndex) {
//   const court = courts[courtName];
//   if (!court || !court.currentPlayers || !court.currentPlayers[playerIndex]) {
//     Swal.fire({ icon: "error", title: `Player not found.` });
//     return;
//   }

//   const removedPlayer = court.currentPlayers.splice(playerIndex, 1)[0];

//   // If all players removed, clear time left and optionally stop timer
//   if (court.currentPlayers.length === 0) {
//     court.timeLeft = 0;
//   }

//   Swal.fire({
//     icon: "success",
//     title: `${removedPlayer} has been removed from ${courtName}`,
//   });

//   await saveCourtData();
//   await loadCourtData();
//   clearBookingFields();
//   renderCourts();
// }
