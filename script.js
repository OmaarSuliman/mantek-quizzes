// Utility: Get query parameter "file"
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

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

// Optional: Header scroll effect
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  if (window.scrollY > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Determine which JSON file to load (from "file" query parameter)
let quizFile = getQueryParam("file") || "data/lec1_drug_absorption.json";
const dataUrl = quizFile;

let quizData = null;

// Fetch quiz data
fetch(dataUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then(data => {
    quizData = data;
    document.getElementById("lecture-title").textContent = data.title || "Lecture Title";
    displayQuestions();
    displayLastScore();
  })
  .catch(error => {
    console.error("Error fetching quiz data:", error);
    const pollContainer = document.getElementById("poll-container");
    pollContainer.innerHTML =
      "<div class='poll error'>Unable to load quiz data. Please try again later.</div>";
  });

function displayQuestions() {
  const pollContainer = document.getElementById("poll-container");
  pollContainer.innerHTML = "";

  quizData.questions.forEach((question) => {
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
        if (pollDiv.dataset.answered === "true") return;
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
}

function checkAllAnswered() {
  const pollCards = document.querySelectorAll(".poll");
  let answeredCount = 0;
  pollCards.forEach(poll => {
    if (poll.dataset.answered === "true") {
      answeredCount++;
    }
  });

  if (answeredCount === pollCards.length) {
    let correctCount = 0;
    pollCards.forEach(poll => {
      if (parseInt(poll.dataset.selected) === parseInt(poll.dataset.correct)) {
        correctCount++;
      }
    });
    showResult(correctCount, pollCards.length);
  }
}

function showResult(correctCount, total) {
  const modal = document.getElementById("result-modal");
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";

  let resultIconSrc = "";
  let resultText = "";

  // New logic for icons:
  if (correctCount === total) {
    resultIconSrc = "Assets/excellent.svg";
    resultText = "Excellent! You got all correct!";
  } else if (correctCount >= total / 2) {
    resultIconSrc = "Assets/success.svg";
    resultText = "Great job!";
  } else {
    resultIconSrc = "Assets/failure.svg";
    resultText = "Better luck next time!";
  }

  const iconImg = document.createElement("img");
  iconImg.src = resultIconSrc;
  iconImg.alt = "Result Icon";
  modalContent.appendChild(iconImg);

  const textEl = document.createElement("p");
  textEl.textContent = `${resultText} (${correctCount}/${total})`;
  modalContent.appendChild(textEl);

  modal.classList.add("show");

  // Save score in localStorage
  const lastScore = {
    quizTitle: quizData.title,
    score: correctCount,
    total: total,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem("lastScore", JSON.stringify(lastScore));

  modal.addEventListener("click", () => {
    modal.classList.remove("show");
  });
}

function displayLastScore() {
  const lastScoreDiv = document.getElementById("last-score");
  const stored = localStorage.getItem("lastScore");
  if (stored) {
    const scoreData = JSON.parse(stored);
    lastScoreDiv.innerHTML = `<strong>Last Score:</strong> ${scoreData.quizTitle} - ${scoreData.score}/${scoreData.total} <br>
      <small>${new Date(scoreData.timestamp).toLocaleString()}</small>`;
  }
}