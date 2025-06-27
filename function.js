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
    matches = Object.values(users).filter((user) =>
      user.email.toLowerCase().includes(search)
    );
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
  const user = users[email];
  if (!user) return;

  window.selectedUserEmail = email;

  const formattedSignInDate = new Date(user.signInDate).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const userDetails = `
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
    <button onclick="editUser('${user.username}')">Edit</button>
    <button onclick="deleteUser('${user.username}')">Delete</button>
    <div id="profilePicSection" style="margin-top:20px;">
      <h4>Upload Profile Picture</h4>
      <input type="file" id="profilePicInput" accept="image/*" />
      <button id="uploadPicBtn">Upload</button>
      <br>
      <img id="currentProfilePic" src="" alt="Profile Picture" style="max-width: 150px; display:none;" />
      <br>
      <button id="deletePicBtn">Delete Profile Picture</button>
    </div>
  `;

  document.getElementById("userDetails").innerHTML = userDetails;

  const profilePicSection = document.getElementById("profilePicSection");
  profilePicSection.style.display = "block";

  const currentPic = document.getElementById("currentProfilePic");

  fetch(`/api/check-profile-pic/${email}`)
    .then(res => res.json())
    .then(({ exists }) => {
      currentPic.src = exists
        ? `/uploads/${email}.jpg?${Date.now()}`
        : "/default-profile-pic.jpg";
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
      alert("No file selected.");
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
        alert("Profile picture uploaded!");
        document.getElementById("currentProfilePic").src = `/uploads/${email}.jpg?${Date.now()}`;
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong.");
    }
  });

  document.getElementById("deletePicBtn").addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete the profile picture?")) return;

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
        alert("Profile picture deleted.");
        const currentPic = document.getElementById("currentProfilePic");
        currentPic.src = "";
        currentPic.style.display = "none";
      } else {
        alert(result.message || "Failed to delete picture.");
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      alert("Something went wrong while deleting the picture.");
    }
  });

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
  const court = document.getElementById("courtSelection").value;
  let enteredPlayers = [];

  let users = {};
  try {
    const response = await fetch("/users");
    const data = await response.json();
    users = data.reduce((acc, user) => {
      acc[user.username] = `${user.firstName} ${user.lastName}`;
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

  const allBookedPlayers = Object.values(courts).flatMap(
    (court) => court.currentPlayers
  );

  for (let i = 1; i <= 4; i++) {
    const username = document
      .getElementById(`bookingUsername${i}`)
      .value.toLowerCase();
    const password = document.getElementById(`bookingPassword${i}`).value;

    if (username && password) {
      const isValid = await validateUser(username, password);
      if (!isValid) return;

      if (allBookedPlayers.includes(users[username])) {
        Swal.fire({
          icon: "error",
          title: `User ${users[username]} is already booked on another court.`,
        });
        return;
      }

      const fullName = users[username] || username;
      enteredPlayers.push(fullName);
    }
  }

  if (enteredPlayers.length !== 2 && enteredPlayers.length !== 4) {
    Swal.fire({
      icon: "error",
      title: "You can only book a court with 2 or 4 players.",
    });
    return;
  }

  const currentPlayers = courts[court].currentPlayers;

  if (currentPlayers.length === 0) {
    courts[court].currentPlayers = enteredPlayers;
    courts[court].timeLeft = 1800;
    startCountdown(court);
  } else if (currentPlayers.length === 2 && enteredPlayers.length === 2) {
    const totalPlayers = [...currentPlayers, ...enteredPlayers];

    const uniquePlayers = new Set(totalPlayers);
    if (uniquePlayers.size < totalPlayers.length) {
      Swal.fire({
        icon: "error",
        title: "A player is already on this court.",
      });
      return;
    }

    courts[court].currentPlayers = totalPlayers;
  } else {
    if (courts[court].queue.length < 3) {
      courts[court].queue.push(enteredPlayers);
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
  let enteredPlayers = [];

  let users = {};
  try {
    const response = await fetch("/users");
    const data = await response.json();
    users = data.reduce((acc, user) => {
      acc[user.username] = `${user.firstName} ${user.lastName}`;
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

  const allBookedPlayers = Object.values(courts).flatMap(
    (court) => court.currentPlayers
  );

  for (let i = 1; i <= 4; i++) {
    const username = document.getElementById(`unbookingUsername${i}`).value;
    const password = document.getElementById(`unbookingPassword${i}`).value;

    if (username && password) {
      const isValid = await validateUser(username, password);
      if (!isValid) return;

      const fullName = users[username] || username;

      if (!allBookedPlayers.includes(fullName)) {
        Swal.fire({
          icon: "error",
          title: `User ${fullName} is not part of any court booking.`,
        });
        return;
      }

      enteredPlayers.push(fullName);
    }
  }

  if (enteredPlayers.length !== 2 && enteredPlayers.length !== 4) {
    Swal.fire({
      icon: "error",
      title: "You must unbook exactly 2 or 4 players.",
    });
    return;
  }

  let unbookedPlayers = [];

  for (const courtName in courts) {
    const courtBooking = courts[courtName];
    const currentPlayers = courtBooking.currentPlayers;

    const playersToUnbook = enteredPlayers.filter((player) =>
      currentPlayers.includes(player)
    );

    if (playersToUnbook.length > 0) {
      courtBooking.currentPlayers = currentPlayers.filter(
        (player) => !playersToUnbook.includes(player)
      );
      unbookedPlayers.push(...playersToUnbook);

      if (courtBooking.currentPlayers.length === 0) {
        courtBooking.timeLeft = 0;

        if (courtBooking.queue.length > 0) {
          const nextQueue = courtBooking.queue.shift();
          courtBooking.currentPlayers = nextQueue;
          courtBooking.timeLeft = 1800;
          startCountdown(courtName);
        }
      }
    }
  }

  if (unbookedPlayers.length === 0) {
    Swal.fire({
      icon: "error",
      title: "No matching players found for unbooking.",
    });
    return;
  }

  saveCourtData();
  clearBookingFields();
  renderCourts();

  Swal.fire({
    icon: "success",
    title: "Court Unbooked Successfully",
    text: `Players ${unbookedPlayers.join(
      ", "
    )} have been successfully unbooked from their court(s).`,
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
      (typeof courtsData !== "undefined" &&
        courtsData[court] === "unavailable") ||
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
      courtDisplay += `<p>Time Left: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}</p>`;
    }

    if (!isUnavailable) {
      courtDisplay += `<p>Current Players: ${
        details.currentPlayers.length
          ? details.currentPlayers.join(", ")
          : "None"
      }</p>`;
    }

    if (isAdminPage && !isUnavailable) {
      details.currentPlayers.forEach((player, i) => {
        courtDisplay += `<p>Player ${
          i + 1
        }: ${player} <button class="remove-btn" onclick="removePlayer('${court}', ${i})">Remove</button></p>`;
      });
    }

    if (!isUnavailable) {
      for (let i = 0; i < 3; i++) {
        courtDisplay += `<p>Queue ${i + 1}: ${
          details.queue[i] && details.queue[i].length
            ? details.queue[i].join(", ")
            : "Empty"
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

function removePlayer(court, playerIndex) {
  const courtData = courts[court];
  const playerName = courtData.currentPlayers[playerIndex];

  if (playerName) {
    courtData.currentPlayers.splice(playerIndex, 1);

    if (courtData.queue && courtData.queue.length > 0) {
      const nextPlayer = courtData.queue.shift();

      courts[court].timeLeft = 1800;

      if (Array.isArray(nextPlayer)) {
        courtData.currentPlayers.push(...nextPlayer);
      } else if (nextPlayer) {
        courtData.currentPlayers.push(nextPlayer);
      }

      resetCourtTimer(court);
    }

    Swal.fire({
      icon: "success",
      title: `${playerName} has been removed from ${court}`,
    });

    localStorage.setItem("courtsData", JSON.stringify(courts));
    renderCourts();
    saveCourtData();
  } else {
    Swal.fire({
      icon: "error",
      title: `Player not found.`,
    });
  }
}
