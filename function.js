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

      // Filter users signed in today
      const today = new Date();
      const signedInTodayUsers = data.filter((user) => {
        const signInDate = new Date(user.signInDate);
        return (
          signInDate.getFullYear() === today.getFullYear() &&
          signInDate.getMonth() === today.getMonth() &&
          signInDate.getDate() === today.getDate()
        );
      });

      // Populate users object with only today's signed-in users
      signedInTodayUsers.forEach((user) => {
        users[user.username] = user;
      });

      let userDropdown = `<h3>Select a User</h3><select id="userSelect" onchange="displayUserDetails()">`;
      userDropdown += `<option value="">-- Select a User --</option>`;

      signedInTodayUsers.forEach((user) => {
        userDropdown += `<option value="${user.username}">${user.username}</option>`;
      });

      userDropdown += `</select>`;

      document.getElementById("userList").innerHTML = userDropdown;
      document.getElementById("userDetails").innerHTML = "";
    })
    .catch((err) => console.error("Error fetching users:", err));
}

function displayUserDetails() {
  let selectedUser = document.getElementById("userSelect").value;
  if (selectedUser) {
    let user = users[selectedUser];

    let formattedSignInDate = new Date(user.signInDate).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

    let userDetails = `
      <h3>User Details</h3>
      <strong>Username:</strong> ${user.username} <br>
      <strong>Password:</strong> ${user.password} <br>
      <strong>First Name:</strong> ${user.firstName} <br>
      <strong>Last Name:</strong> ${user.lastName} <br>
      <strong>Email:</strong> ${user.email} <br>
      <strong>Registered:</strong> ${user.registered} <br>
      <strong>Membership:</strong> ${user.membership} <br>
      <strong>Sign In Date:</strong> ${formattedSignInDate} <br>
      <strong>isSignedIn:</strong> ${user.isSignedIn} <br>
      <button onclick="editUser('${user.username}')">Edit</button>
      <button onclick="deleteUser('${user.username}')">Delete</button>
      `;

    let today = new Date();

    // Get users signed in today
    let signedInTodayUsers = Object.values(users).filter((user) => {
      let signInDate = new Date(user.signInDate);
      return (
        signInDate.getFullYear() === today.getFullYear() &&
        signInDate.getMonth() === today.getMonth() &&
        signInDate.getDate() === today.getDate()
      );
    });

    let totalSignedInToday = signedInTodayUsers.length;

    // Users with membership signed in today (assuming membership > 0 is valid)
    let signedInWithMembership = signedInTodayUsers.filter(
      (user) => user.membership > 0
    ).length;

    // Users without membership signed in today
    let signedInWithoutMembership = totalSignedInToday - signedInWithMembership;

    let statsHtml = `
      <h3>User Statistics</h3>
      <strong>Users Signed In Today:</strong> ${totalSignedInToday} <br>
      <strong>With Membership:</strong> ${signedInWithMembership} <br>
      <strong>Drop In:</strong> ${signedInWithoutMembership} <br>
      `;

    // Create dropdown for users signed in today
    let signedInDropdown = `<label for="signedInSelect"><h3>Users Signed In Today</h3></label>
      <select id="signedInSelect" onchange="displaySignedInUserDetails()">
          <option value="">Select a User</option>`;

    signedInTodayUsers.forEach((user) => {
      signedInDropdown += `<option value="${user.username}">${user.username}</option>`;
    });

    signedInDropdown += `</select>`;

    document.getElementById("userStats").innerHTML = statsHtml;
    document.getElementById("userDetails").innerHTML = userDetails;
    document.getElementById("signedInDropdown").innerHTML = signedInDropdown;
  } else {
    document.getElementById("userDetails").innerHTML = "";
    document.getElementById("signedInDropdown").innerHTML = "";
  }
}

function displaySignedInUserDetails() {
  let selectedSignedInUser = document.getElementById("signedInSelect").value;
  if (selectedSignedInUser) {
    let user = users[selectedSignedInUser];

    let formattedSignInDate = new Date(user.signInDate).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

    let signedInUserDetails = `
      <h3>Signed In User Details</h3>
      <strong>Username:</strong> ${user.username} <br>
      <strong>Password:</strong> ${user.password} <br>
      <strong>First Name:</strong> ${user.firstName} <br>
      <strong>Last Name:</strong> ${user.lastName} <br>
      <strong>Email:</strong> ${user.email} <br>
      <strong>Registered:</strong> ${user.registered} <br>
      <strong>Membership:</strong> ${user.membership} <br>
      <strong>Sign In Date:</strong> ${formattedSignInDate} <br>
      <strong>isSignedIn:</strong> ${user.isSignedIn} <br>
      <button onclick="editUser('${user.username}')">Edit</button>
      <button onclick="deleteUser('${user.username}')">Delete</button>
      `;

    document.getElementById("signedInUserDetails").innerHTML =
      signedInUserDetails;
  } else {
    document.getElementById("signedInUserDetails").innerHTML = "";
  }
}

function editUser(username) {
  let newPassword = prompt(
    `Enter new password for ${username} (leave blank to keep unchanged):`
  );
  let newFirstName = prompt(
    `Enter new first name for ${username} (leave blank to keep unchanged):`
  );
  let newLastName = prompt(
    `Enter new last name for ${username} (leave blank to keep unchanged):`
  );
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
  let newSignInDate = prompt(
    `Enter new sign-in date for ${username} (leave blank to keep unchanged):`
  );
  let newIsSignedIn = confirm(
    `Is ${username} currently signed in? Click OK for Yes, Cancel for No.`
  )
    ? 1
    : 0;

  let updatedData = {};

  if (newPassword) updatedData.password = newPassword;
  if (newFirstName) updatedData.firstName = newFirstName;
  if (newLastName) updatedData.lastName = newLastName;
  if (newEmail) updatedData.email = newEmail;
  if (newMembership) updatedData.membership = newMembership;
  if (newSignInDate) updatedData.signInDate = newSignInDate;
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

    return true; // User is valid and registered
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

  if (courts[court].currentPlayers.length === 0) {
    courts[court].currentPlayers = enteredPlayers;
    courts[court].timeLeft = 150;
    startCountdown(court);
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
    const username = document.getElementById(`unbookingUsername${i}`).value;
    const password = document.getElementById(`unbookingPassword${i}`).value;

    if (username && password) {
      const isValid = await validateUser(username, password);
      if (!isValid) return;

      const fullName = users[username] || username;

      if (!allBookedPlayers.includes(fullName)) {
        Swal.fire({
          icon: "error",
          title: `User ${fullName} is not part of the current court booking.`,
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

  const courtBooking = courts[court];
  const currentPlayers = courtBooking.currentPlayers;

  const playersToUnbook = enteredPlayers.filter((player) =>
    currentPlayers.includes(player)
  );

  if (playersToUnbook.length === 0) {
    Swal.fire({
      icon: "error",
      title: "No matching players found for unbooking.",
    });
    return;
  }

  courtBooking.currentPlayers = currentPlayers.filter(
    (player) => !playersToUnbook.includes(player)
  );

  if (courtBooking.currentPlayers.length === 0) {
    courtBooking.timeLeft = 0;
  }

  if (
    courtBooking.currentPlayers.length === 0 &&
    courtBooking.queue.length > 0
  ) {
    const nextQueue = courtBooking.queue.shift();
    courtBooking.currentPlayers = nextQueue;
    courtBooking.timeLeft = 150;
    startCountdown(court);
  }

  saveCourtData();
  clearBookingFields();
  renderCourts();

  Swal.fire({
    icon: "success",
    title: "Court Unbooked Successfully",
    text: `Players ${enteredPlayers.join(
      ", "
    )} have been successfully unbooked from the court.`,
  });
}

function saveCourtData() {
  fetch("/update-courts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courts),
  });
}

function loadCourtData() {
  fetch("/courts")
    .then((response) => response.json())
    .then((data) => {
      courts = data;

      Object.keys(courts).forEach((court) => {
        if (
          courts[court].currentPlayers.length > 0 &&
          courts[court].timeLeft > 0
        ) {
          startCountdown(court);
        }
      });

      renderCourts();
    })
    .catch((err) => console.error("Error fetching courts:", err));
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
        courts[court].timeLeft = 150;
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
  let courtCount = 1;

  const isAdminPage = window.location.pathname.includes("admin.html"); // Check if it's the admin page

  const courtEntries = Object.entries(courts);

  courtEntries.forEach(([court, details], index) => {
    let minutes = Math.floor(details.timeLeft / 60);
    let seconds = details.timeLeft % 60;

    let courtStatusClass =
      details.currentPlayers.length === 0 ? "open" : "closed";
    if (court === "Court 10") {
      courtStatusClass += " unavailable"; // Mark Court 10 as unavailable
    }

    let courtDisplay = `<div class="court-card ${courtStatusClass}">`;
    courtDisplay += `<h3>${court}</h3>`;

    const statusText =
      court === "Court 10"
        ? "Unavailable"
        : details.currentPlayers.length === 0
        ? "Open"
        : "Closed";
    courtDisplay += `<p class="status">${statusText}</p>`;

    if (courtStatusClass === "closed") {
      courtDisplay += `<p>Time Left: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}</p>`;
    }

    courtDisplay += `<p>Current Players: ${
      details.currentPlayers.join(", ") || "None"
    }</p>`;

    if (isAdminPage) {
      details.currentPlayers.forEach((player, index) => {
        courtDisplay += `<p>Player ${
          index + 1
        }: ${player} <button onclick="removePlayer(${
          index + 1
        })">Remove</button></p>`;
      });
    }

    for (let i = 0; i < 3; i++) {
      courtDisplay += `<p>Queue ${i + 1}: ${
        details.queue[i] ? details.queue[i].join(", ") : "Empty"
      }</p>`;
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

function removePlayer(playerIndex) {
  const court = document.getElementById("courtSelection").value;
  const playerName = courts[court].currentPlayers[playerIndex - 1];

  if (playerName) {
    courts[court].currentPlayers.splice(playerIndex - 1, 1); // Remove player from the list
    Swal.fire({
      icon: "success",
      title: `${playerName} has been removed from ${court}`,
    });

    // Update the courts data in local storage
    localStorage.setItem("courtsData", JSON.stringify(courts));

    renderCourts(); // Re-render the courts to reflect the change in the UI
    saveCourtData(); // Optionally save data to a backend or elsewhere
  } else {
    Swal.fire({
      icon: "error",
      title: `Player not found.`,
    });
  }
}
