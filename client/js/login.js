// Login and Register page logic

document.addEventListener("DOMContentLoaded", function() {
  // If already logged in, redirect to board
  if (isLoggedIn()) {
    window.location.href = "board.html";
    return;
  }

  var loginForm = document.getElementById("login-form");
  var registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      var username = document.getElementById("login-username").value.trim();
      var password = document.getElementById("login-password").value;

      showPageMessage("login-message", "Logging in...", false);

      try {
        var data = await apiRequest("/auth/login", "POST", {
          username: username,
          password: password
        });

        saveSession(data.token, data.hero);
        showPageMessage("login-message", "Login successful! Entering the world...", false);
        setTimeout(function() {
          window.location.href = "board.html";
        }, 500);
      } catch (err) {
        showPageMessage("login-message", err.message, true);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      var username = document.getElementById("reg-username").value.trim();
      var password = document.getElementById("reg-password").value;
      var avatar = document.getElementById("reg-avatar").value;

      var heroClasses = [];
      if (document.getElementById("class-coder").checked) heroClasses.push("Coder");
      if (document.getElementById("class-designer").checked) heroClasses.push("Designer");
      if (document.getElementById("class-thinker").checked) heroClasses.push("Thinker");

      if (heroClasses.length === 0) {
        showPageMessage("register-message", "Please select at least one hero class.", true);
        return;
      }

      showPageMessage("register-message", "Creating your hero...", false);

      try {
        var data = await apiRequest("/auth/register", "POST", {
          username: username,
          password: password,
          avatar: avatar,
          heroClasses: heroClasses
        });

        saveSession(data.token, data.hero);
        showPageMessage("register-message", "Hero created successfully! Entering...", false);
        setTimeout(function() {
          window.location.href = "board.html";
        }, 500);
      } catch (err) {
        showPageMessage("register-message", err.message, true);
      }
    });
  }
});
