// Utility: Get query parameter from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Global variable to store all questions
let allQuestions = [];

// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Theme toggle with localStorage
const themeToggle = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme") || "dark";
if (currentTheme === "light") {
  document.body.classList.add("light-mode");
  themeToggle.checked = true;
}
themeToggle.addEventListener("change", () => {
  if (themeToggle.checked) {
    document.body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }
});

// Optional: Header scroll effect for subtle styling changes
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  if (window.scrollY > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Load quiz data – supports single quiz (via "file") or combined quiz (via "files")
function loadQuizData() {
  let filesParam = getQueryParam("files");
  if (filesParam) {
    // Combined quiz: "files" is a comma-separated list of JSON file paths.
    let fileList = filesParam.split(",");
    let fetches = fileList.map(filePath =>
      fetch(filePath.trim()).then(resp => {
        if (!resp.ok) throw new Error("Error fetching " + filePath);
        return resp.json();
      })
    );
    Promise.all(fetches)
      .then(results => {
        let combinedQuestions = [];
        results.forEach(data => {
          combinedQuestions = combinedQuestions.concat(data.questions);
        });
        // Shuffle the combined questions
        allQuestions = shuffleArray(combinedQuestions);
        document.getElementById("lecture-title").textContent =
          (results[0].title || "Combined Quiz") + " (Combined)";
        renderAllQuestions();
      })
      .catch(error => {
        console.error("Error fetching combined quiz data:", error);
        document.getElementById("poll-container").innerHTML =
          "<div class='poll error'>Unable to load quiz data. Please try again later.</div>";
      });
  } else {
    // Single quiz: use "file" query parameter (or default)
    let fileParam = getQueryParam("file") || "data/lec1_drug_absorption.json";
    fetch(fileParam)
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(data => {
        allQuestions = data.questions;
        document.getElementById("lecture-title").textContent = data.title || "Lecture Quiz";
        renderAllQuestions();
      })
      .catch(error => {
        console.error("Error fetching quiz data:", error);
        document.getElementById("poll-container").innerHTML =
          "<div class='poll error'>Unable to load quiz data. Please try again later.</div>";
      });
  }
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Render all questions at once
function renderAllQuestions() {
  const pollContainer = document.getElementById("poll-container");
  allQuestions.forEach(question => {
    const pollDiv = document.createElement("div");
    pollDiv.className = "poll";
    pollDiv.dataset.correct = question.correct;

    const questionEl = document.createElement("h3");
    questionEl.textContent = question.question;
    pollDiv.appendChild(questionEl);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    question.options.forEach((optionText, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option";
      optionDiv.textContent = optionText;
      optionDiv.dataset.index = index;

      optionDiv.addEventListener("click", () => {
        if (pollDiv.dataset.answered === "true") return; // prevent re-answering
        pollDiv.dataset.answered = "true";
        pollDiv.dataset.selected = index;
        const allOptions = optionsDiv.querySelectorAll(".option");
        allOptions.forEach(opt => {
          opt.style.pointerEvents = "none";
        });
        if (parseInt(index) === parseInt(pollDiv.dataset.correct)) {
          optionDiv.style.borderColor = "var(--border-correct)";
          optionDiv.style.backgroundColor = "rgba(52, 199, 89, 0.15)";
        } else {
          optionDiv.style.borderColor = "var(--border-incorrect)";
          optionDiv.style.backgroundColor = "rgba(255, 59, 48, 0.15)";
          allOptions.forEach(opt => {
            if (parseInt(opt.dataset.index) === parseInt(pollDiv.dataset.correct)) {
              opt.style.borderColor = "var(--border-correct)";
              opt.style.backgroundColor = "rgba(52, 199, 89, 0.15)";
            }
          });
        }
        checkAllAnswered();
      });

      optionsDiv.appendChild(optionDiv);
    });

    pollDiv.appendChild(optionsDiv);
    pollContainer.appendChild(pollDiv);
  });
  // After rendering, check if all questions are answered (in case there are no questions)
  checkAllAnswered();
}

// Check if all questions are answered; if so, show the result popup.
function checkAllAnswered() {
  const polls = document.querySelectorAll(".poll");
  let answeredCount = 0;
  polls.forEach(poll => {
    if (poll.dataset.answered === "true") answeredCount++;
  });
  if (answeredCount === polls.length) {
    showResult();
  }
}

// Show the result popup with randomized phrases based on score
function showResult() {
  const polls = document.querySelectorAll(".poll");
  let correctCount = 0;
  polls.forEach(poll => {
    if (parseInt(poll.dataset.selected) === parseInt(poll.dataset.correct)) {
      correctCount++;
    }
  });
  const total = allQuestions.length;
  const modal = document.getElementById("result-modal");
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";

  // Define phrase arrays for different score ranges
  const excellentPhrases = [
    "Excellent job! You're a genius!",
    "Perfect score—amazing!",
    "Outstanding! You nailed it!"
  ];
  const successPhrases = [
    "Great job, keep it up!",
    "Well done, almost perfect!",
    "Good work, you did well!"
  ];
  const failurePhrases = [
    "Better luck next time!",
    "Don't worry—try again!",
    "Keep practicing!"
  ];

  let resultIconSrc = "";
  let resultText = "";
  if (correctCount === total) {
    resultIconSrc = "Assets/excellent.svg";
    resultText = excellentPhrases[Math.floor(Math.random() * excellentPhrases.length)];
  } else if (correctCount >= total / 2) {
    resultIconSrc = "Assets/success.svg";
    resultText = successPhrases[Math.floor(Math.random() * successPhrases.length)];
  } else {
    resultIconSrc = "Assets/failure.svg";
    resultText = failurePhrases[Math.floor(Math.random() * failurePhrases.length)];
  }

  // Create and append the icon (larger)
  const iconImg = document.createElement("img");
  iconImg.src = resultIconSrc;
  iconImg.alt = "Result Icon";
  modalContent.appendChild(iconImg);

  // Create and append the text (with additional margin-top)
  const textEl = document.createElement("p");
  textEl.textContent = `${resultText} (${correctCount}/${total})`;
  modalContent.appendChild(textEl);

  modal.classList.add("show");

  // Save score in localStorage for later display
  const lastScore = {
    quizTitle: document.getElementById("lecture-title").textContent,
    score: correctCount,
    total: total,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem("lastScore", JSON.stringify(lastScore));

  modal.addEventListener("click", () => {
    modal.classList.remove("show");
  });
}

// Display the last saved score (if any) on the quiz page
function displayLastScore() {
  const lastScoreDiv = document.getElementById("last-score");
  const stored = localStorage.getItem("lastScore");
  if (stored) {
    const scoreData = JSON.parse(stored);
    lastScoreDiv.innerHTML = `<strong>Last Score:</strong> ${scoreData.quizTitle} - ${scoreData.score}/${scoreData.total} <br>
      <small>${new Date(scoreData.timestamp).toLocaleString()}</small>`;
  }
}

// Initialize by loading the quiz data
loadQuizData();
displayLastScore();
