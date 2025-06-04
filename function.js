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
    matches = Object.values(users).filter(user =>
      user.email.toLowerCase().includes(search)
    );
  }

  matches.forEach(user => {
    const item = document.createElement("li");
    item.textContent = user.email;
    item.onclick = () => {
      displayUserDetails(user.email);
      suggestionBox.innerHTML = "";
      document.getElementById("emailSearch").value = user.email;
    };
    suggestionBox.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailSearch");
  emailInput.addEventListener("focus", filterUsersByEmail);
});



function displayUserDetails(email) {
  const user = users[email];
  if (!user) return;

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
  `;

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
  const signedInWithMembership = signedInTodayUsers.filter(u => u.membership > 0).length;
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

  document.getElementById("userDetails").innerHTML = userDetails;
  document.getElementById("userStats").innerHTML = statsHtml;
  document.getElementById("signedInDropdown").innerHTML = signedInDropdown;
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
  let newPassword = prompt(
    `Enter new password for ${username} (leave blank to keep unchanged):`
  );

  
  // let newFirstName = prompt(
  //   `Enter new first name for ${username} (leave blank to keep unchanged):`
  // );
  // let newLastName = prompt(
  //   `Enter new last name for ${username} (leave blank to keep unchanged):`
  // );
  let newEmail = prompt(
    `Enter new email for ${username} (leave blank to keep unchanged):`
  );

  let newregistered = confirm(
    `Approve user ${username}? Click OK for Yes, Cancel for No.`
  )
    ? 1
    : 0;

  let newMembership = prompt(
    `Enter new membership for ${username} (leave blank to keep unchanged):`
  );
  // let newSignInDate = prompt(
  //   `Enter new sign-in date for ${username} (leave blank to keep unchanged):`
  // );
  let newIsSignedIn = confirm(
    `Is ${username} currently signed in? Click OK for Yes, Cancel for No.`
  )
    ? 1
    : 0;

  let updatedData = {};

  if (newPassword) updatedData.password = newPassword;
  // if (newFirstName) updatedData.firstName = newFirstName;
  // if (newLastName) updatedData.lastName = newLastName;
  if (newEmail) {
    updatedData.email = newEmail;
    updatedData.username = newEmail;
  }
  if (newMembership) updatedData.membership = newMembership;
  // if (newSignInDate) updatedData.signInDate = newSignInDate;
  updatedData.isSignedIn = newIsSignedIn;
  updatedData.registered = newregistered;

  if (Object.keys(updatedData).length === 0) {
    alert("No changes were made.");
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
        alert(`Error: ${data.error}`);
      } else {
        alert(`User ${username} updated successfully!`);
        showUsers();
        location.reload();
      }
    })
    .catch((err) => console.error("Error updating user:", err));
}

function deleteUser(username) {
  if (confirm(`Are you sure you want to delete ${username}?`)) {
    fetch(`/users/${username}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => {
        alert(`${username} deleted`);
        showUsers();
        location.reload();
      })
      .catch((err) => console.error("Error deleting user:", err));
  }
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
    const username = document.getElementById(`bookingUsername${i}`).value;
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
    let isUnavailable = (typeof courtsData !== "undefined" && courtsData[court] === "unavailable") || court === "Rest Area";
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
    }

    if (!isUnavailable) {
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
